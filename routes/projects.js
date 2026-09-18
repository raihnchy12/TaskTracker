const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Ambil semua proyek
// routes/projects.js

router.get('/', async (req, res, next) => {
  try {
    // Hanya ambil proyek yang kolom owner_id-nya sesuai dengan ID user dari token JWT
    const result = await db.query(
      'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id] // req.user didapat dari authenticateToken middleware
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { title, description } = req.body;
  const ownerId = req.user.id; // Diambil dari Token JWT via authenticateToken

  if (!title) {
    res.status(400);
    return next(new Error('Title proyek wajib diisi'));
  }

  try {
    const result = await db.query(
      `INSERT INTO projects (title, description, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description || null, ownerId] // ownerId WAJIB dimasukkan
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

// DELETE /api/projects/:id (Hapus Proyek beserta Tugasnya)
router.delete('/:id', async (req, res, next) => {
  const projectId = req.params.id;
  const ownerId = req.user.id;

  try {
    // 1. Hapus semua tugas di dalam proyek ini terlebih dahulu
    await db.query(
      `DELETE FROM tasks 
       WHERE project_id = $1 
       AND project_id IN (SELECT id FROM projects WHERE id = $1 AND owner_id = $2)`,
      [projectId, ownerId]
    );

    // 2. Hapus proyek berdasarkan ID dan owner_id
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