const express = require('express');
const router = express.Router();
const db = require('../db');

// Daftar status yang valid untuk papan Kanban (Backlog -> To Do -> In Progress -> Review -> Done)
const VALID_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

// Helper untuk sanitasi tanggal sebelum masuk ke query PostgreSQL
const parseValidDate = (dateString) => {
  if (!dateString || dateString.trim() === '') return null;
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() > 9999) {
    return null;
  }
  return dateString;
};

// 1. GET /api/tasks/project/:projectId - Ambil semua tugas berdasarkan Project ID
router.get('/project/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const queryText = `
      SELECT tasks.* 
      FROM tasks 
      JOIN projects ON tasks.project_id = projects.id
      WHERE tasks.project_id = $1 AND projects.owner_id = $2
      ORDER BY tasks.id ASC
    `;

    const result = await db.query(queryText, [projectId, userId]);

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/tasks - Tambah tugas baru ke proyek
router.post('/', async (req, res, next) => {
  const { project_id, title, description, status, priority, due_date } = req.body;
  const userId = req.user.id;

  if (!project_id || !title || !title.trim()) {
    res.status(400);
    return next(new Error('project_id dan title wajib diisi'));
  }

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400);
    return next(new Error(`Status tidak valid. Gunakan salah satu: ${VALID_STATUSES.join(', ')}`));
  }

  try {
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [project_id, userId]
    );

    if (projectCheck.rows.length === 0) {
      res.status(404);
      return next(new Error('Proyek tidak ditemukan atau kamu tidak memiliki akses ke proyek ini'));
    }

    const cleanDueDate = parseValidDate(due_date);

    const queryText = `
      INSERT INTO tasks (project_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      project_id, 
      title.trim(), 
      description && description.trim() !== '' ? description.trim() : null, 
      status || 'BACKLOG', 
      priority || 'MEDIUM', 
      cleanDueDate
    ];

    const result = await db.query(queryText, values);

    res.status(201).json({
      success: true,
      message: 'Tugas berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 3. PUT /api/tasks/:id - Edit Detail Lengkap Tugas (Title, Description, Status, Priority, Due Date)
router.put('/:id', async (req, res, next) => {
  const taskId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const { title, description, status, priority, due_date } = req.body;

  if (isNaN(taskId)) {
    res.status(400);
    return next(new Error('ID tugas tidak valid'));
  }

  if (!title || !title.trim()) {
    res.status(400);
    return next(new Error('Title tugas wajib diisi'));
  }

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400);
    return next(new Error(`Status tidak valid. Gunakan salah satu: ${VALID_STATUSES.join(', ')}`));
  }

  try {
    const existingTask = await db.query(
      `SELECT status FROM tasks 
       WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE owner_id = $2)`,
      [taskId, userId]
    );

    if (existingTask.rows.length === 0) {
      res.status(404);
      return next(new Error('Tugas tidak ditemukan atau kamu tidak memiliki akses untuk mengubahnya'));
    }

    const currentStatus = existingTask.rows[0].status;
    const cleanDueDate = parseValidDate(due_date);

    const queryText = `
      UPDATE tasks 
      SET title = $1, 
          description = $2, 
          status = $3, 
          priority = $4, 
          due_date = $5 
      WHERE id = $6 
      AND project_id IN (SELECT id FROM projects WHERE owner_id = $7)
      RETURNING *
    `;

    const values = [
      title.trim(), 
      description && description.trim() !== '' ? description.trim() : null, 
      status || currentStatus, 
      priority || 'MEDIUM', 
      cleanDueDate, 
      taskId, 
      userId
    ];

    const result = await db.query(queryText, values);

    res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 4. PATCH /api/tasks/:id/status - Update Status Tugas Saja (dipakai saat drag & drop kanban)
router.patch('/:id/status', async (req, res, next) => {
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;
  const userId = req.user.id;

  if (isNaN(taskId)) {
    res.status(400);
    return next(new Error('ID tugas tidak valid'));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400);
    return next(new Error(`Status tidak valid. Gunakan salah satu: ${VALID_STATUSES.join(', ')}`));
  }

  try {
    const result = await db.query(
      `UPDATE tasks 
       SET status = $1 
       WHERE id = $2 
       AND project_id IN (SELECT id FROM projects WHERE owner_id = $3)
       RETURNING *`,
      [status, taskId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Tugas tidak ditemukan atau kamu tidak memiliki akses untuk mengubahnya'));
    }

    res.json({
      success: true,
      message: 'Status tugas berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/tasks/:id - Hapus Tugas
router.delete('/:id', async (req, res, next) => {
  const taskId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(taskId)) {
    res.status(400);
    return next(new Error('ID tugas tidak valid'));
  }

  try {
    const result = await db.query(
      `DELETE FROM tasks 
       WHERE id = $1 
       AND project_id IN (SELECT id FROM projects WHERE owner_id = $2)
       RETURNING id`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Tugas tidak ditemukan atau kamu tidak memiliki akses untuk menghapusnya'));
    }

    res.json({
      success: true,
      message: 'Tugas berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;