const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. GET /api/projects - Ambil semua proyek milik user yang sedang login
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/projects - Tambah proyek baru
router.post('/', async (req, res, next) => {
  const { title, description } = req.body;
  const ownerId = req.user.id;

  if (!title) {
    res.status(400);
    return next(new Error('Title proyek wajib diisi'));
  }

  try {
    const result = await db.query(
      `INSERT INTO projects (title, description, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description || null, ownerId]
    );

    res.status(201).json({
      success: true,
      message: 'Proyek berhasil dibuat',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 3. PUT /api/projects/:id - Edit Proyek
router.put('/:id', async (req, res, next) => {
  const projectId = req.params.id;
  const ownerId = req.user.id;
  const { title, description } = req.body;

  if (!title) {
    res.status(400);
    return next(new Error('Title proyek wajib diisi'));
  }

  try {
    const result = await db.query(
      `UPDATE projects 
       SET title = $1, description = $2 
       WHERE id = $3 AND owner_id = $4 
       RETURNING *`,
      [title, description || null, projectId, ownerId]
    );

    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Proyek tidak ditemukan atau kamu tidak memiliki akses'));
    }

    res.json({
      success: true,
      message: 'Proyek berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// 4. DELETE /api/projects/:id - Hapus Proyek beserta Tugasnya
router.delete('/:id', async (req, res, next) => {
  const projectId = req.params.id;
  const ownerId = req.user.id;

  try {
    await db.query(
      `DELETE FROM tasks 
       WHERE project_id = $1 
       AND project_id IN (SELECT id FROM projects WHERE id = $1 AND owner_id = $2)`,
      [projectId, ownerId]
    );

    const result = await db.query(
      `DELETE FROM projects 
       WHERE id = $1 AND owner_id = $2 
       RETURNING *`,
      [projectId, ownerId]
    );

    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Proyek tidak ditemukan atau kamu tidak memiliki akses'));
    }

    res.status(200).json({
      success: true,
      message: 'Proyek dan seluruh tugas di dalamnya berhasil dihapus',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;