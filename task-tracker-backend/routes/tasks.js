const express = require('express');
const router = express.Router();
const db = require('../db');

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

  if (!project_id || !title) {
    res.status(400);
    return next(new Error('project_id dan title wajib diisi'));
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

    const queryText = `
      INSERT INTO tasks (project_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      project_id, 
      title, 
      description || null, 
      status || 'TODO', 
      priority || 'MEDIUM', 
      due_date || null
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
  const taskId = req.params.id;
  const userId = req.user.id;
  const { title, description, status, priority, due_date } = req.body;

  if (!title) {
    res.status(400);
    return next(new Error('Title tugas wajib diisi'));
  }

  try {
    const result = await db.query(
      `UPDATE tasks 
       SET title = $1, description = $2, status = $3, priority = $4, due_date = $5 
       WHERE id = $6 
       AND project_id IN (SELECT id FROM projects WHERE owner_id = $7)
       RETURNING *`,
      [
        title, 
        description || null, 
        status || 'TODO', 
        priority || 'MEDIUM', 
        due_date || null, 
        taskId, 
        userId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Tugas tidak ditemukan atau kamu tidak memiliki akses untuk mengubahnya'));
    }

    res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 4. PATCH /api/tasks/:id/status - Update Status Tugas Saja (Quick Status Switch)
router.patch('/:id/status', async (req, res, next) => {
  const taskId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    return next(new Error('Status tidak valid. Gunakan: TODO, IN_PROGRESS, atau DONE'));
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
  const taskId = req.params.id;
  const userId = req.user.id;

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