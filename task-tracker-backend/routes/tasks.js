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

// 1. GET /api/tasks/project/:projectId - Ambil tugas berdasarkan Project ID (dengan Filter, Search, Sort & Pagination BE-23)
router.get('/project/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  // Baca Query Parameters dari URL (BE-23)
  const { search, priority, status, sort, page, limit } = req.query;

  try {
    // Array parameter dinamis untuk PostgreSQL query
    const queryParams = [projectId, userId];
    
    // Syarat Wajib: project_id cocok & dikelola oleh owner yang sedang login
    let whereClause = `WHERE tasks.project_id = $1 AND projects.owner_id = $2`;

    // 1. Pencarian Teks (Judul atau Deskripsi)
    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      whereClause += ` AND (tasks.title ILIKE $${queryParams.length} OR tasks.description ILIKE $${queryParams.length})`;
    }

    // 2. Filter Prioritas (HIGH, MEDIUM, LOW)
    if (priority && priority.trim() !== '' && priority !== 'ALL') {
      queryParams.push(priority.trim().toUpperCase());
      whereClause += ` AND tasks.priority = $${queryParams.length}`;
    }

    // 3. Filter Status Kolom (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)
    if (status && status.trim() !== '' && VALID_STATUSES.includes(status.trim().toUpperCase())) {
      queryParams.push(status.trim().toUpperCase());
      whereClause += ` AND tasks.status = $${queryParams.length}`;
    }

    // 4. Pengurutan (Sorting)
    let orderByClause = `ORDER BY tasks.id ASC`;
    if (sort === 'dueDate') {
      // Tenggat terdekat didahulukan (data tanpa due_date ditaruh di paling belakang)
      orderByClause = `ORDER BY tasks.due_date ASC NULLS LAST, tasks.id ASC`;
    } else if (sort === 'priority') {
      // Prioritas tertinggi ke terendah
      orderByClause = `ORDER BY CASE tasks.priority 
                          WHEN 'HIGH' THEN 1 
                          WHEN 'MEDIUM' THEN 2 
                          WHEN 'LOW' THEN 3 
                          ELSE 4 
                        END ASC, tasks.id ASC`;
    } else if (sort === 'createdAt') {
      orderByClause = `ORDER BY tasks.id DESC`;
    }

    // 5. Hitung total data yang cocok (untuk Metadata Pagination)
    const countQuery = `
      SELECT COUNT(tasks.id) AS total_count
      FROM tasks 
      JOIN projects ON tasks.project_id = projects.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalTasks = parseInt(countResult.rows[0].total_count, 10);

    // 6. Pagination (Page & Limit)
    let paginationClause = '';
    let pageNum = null;
    let limitNum = null;
    let totalPages = 1;

    if (page || limit) {
      pageNum = parseInt(page, 10) || 1;
      limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      queryParams.push(limitNum);
      const limitParamIndex = queryParams.length;

      queryParams.push(offset);
      const offsetParamIndex = queryParams.length;

      paginationClause = `LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
      totalPages = Math.ceil(totalTasks / limitNum) || 1;
    }

    // 7. Eksekusi Query Utama
    const mainQuery = `
      SELECT tasks.* 
      FROM tasks 
      JOIN projects ON tasks.project_id = projects.id
      ${whereClause}
      ${orderByClause}
      ${paginationClause}
    `;

    const result = await db.query(mainQuery, queryParams);

    res.json({
      success: true,
      total: totalTasks,
      data: result.rows,
      pagination: (page || limit) ? {
        currentPage: pageNum,
        totalPages: totalPages,
        totalTasks: totalTasks,
        limit: limitNum
      } : null
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