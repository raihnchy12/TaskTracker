const express = require('express');
const router = express.Router();
const db = require('../db');

// Import Middleware & Schema Validasi
const validate = require('../middleware/validateMiddleware');
const { createTaskSchema, updateTaskStatusSchema, updateTaskSchema } = require('../schemas/taskSchema');

// 1. GET /api/tasks/project/:projectId - Ambil semua task per proyek
router.get('/project/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const { page = 1, limit = 5, sort = 'dueDate', search, priority } = req.query;

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 5;
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    let baseQuery = 'FROM tasks WHERE project_id = $1';
    const queryParams = [projectId];
    let paramIndex = 2;

    if (search) {
      baseQuery += ` AND (LOWER(title) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (priority && priority !== 'ALL') {
      baseQuery += ` AND priority = $${paramIndex}`;
      queryParams.push(priority);
      paramIndex++;
    }

    const countResult = await db.query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
    const totalTasks = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalTasks / parsedLimit) || 1;

    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'dueDate') {
      orderBy = 'ORDER BY due_date ASC NULLS LAST';
    } else if (sort === 'priority') {
      orderBy = `ORDER BY CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END ASC`;
    }

    const tasksQuery = `SELECT * ${baseQuery} ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parsedLimit, offset);

    const tasksResult = await db.query(tasksQuery, queryParams);

    return res.status(200).json({
      success: true,
      data: tasksResult.rows,
      pagination: {
        currentPage: parsedPage,
        totalPages,
        totalTasks,
        limit: parsedLimit,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/tasks - Buat task baru (Diproteksi dengan createTaskSchema)
router.post('/', validate(createTaskSchema), async (req, res, next) => {
  const { project_id, title, description, status, priority, due_date } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        project_id,
        title,
        description || null,
        status || 'BACKLOG',
        priority || 'MEDIUM',
        due_date || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Tugas berhasil dibuat',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// 3. PATCH /api/tasks/:id/status - Update status task (Diproteksi dengan updateTaskStatusSchema)
router.patch('/:id/status', validate(updateTaskStatusSchema), async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status tugas berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// 4. PUT /api/tasks/:id - Edit detail task
router.put('/:id', validate(updateTaskSchema), async (req, res, next) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;

  try {
    const result = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, status, priority, due_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/tasks/:id - Hapus task
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tugas berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;