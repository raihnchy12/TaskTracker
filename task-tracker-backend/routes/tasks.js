const express = require('express');
const router = express.Router();
const db = require('../db');


// 1. Ambil semua tugas berdasarkan Project ID (Aman & Terisolasi per User)
router.get('/project/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id; // Didapat dari token JWT via authenticateToken

  try {
    // Kueri menggunakan JOIN ke tabel projects untuk memastikan project_id tersebut adalah milik user yang sedang login
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
    next(err); // Lempar ke errorMiddleware terpusat
  }
});

// 2. Tambah tugas baru ke proyek (Aman & Terisolasi per User)
router.post('/', async (req, res, next) => {
  const { project_id, title, description, status, priority, assigned_to, due_date } = req.body;
  const userId = req.user.id; // Diambil dari token JWT via authenticateToken

  // Validasi field wajib
  if (!project_id || !title) {
    res.status(400);
    return next(new Error('project_id dan title wajib diisi'));
  }

  try {
    // 1. Verifikasi terlebih dahulu apakah proyek tersebut benar-benar milik user yang sedang login
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [project_id, userId]
    );

    if (projectCheck.rows.length === 0) {
      res.status(404);
      return next(new Error('Proyek tidak ditemukan atau kamu tidak memiliki akses ke proyek ini'));
    }

    // 2. Jika proyek valid dan milik user, lakukan INSERT tugas
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
    next(err); // Lempar error ke errorMiddleware terpusat
  }
});

// 3. Update status tugas (Misal: Pindah dari 'TODO' ke 'IN_PROGRESS' atau 'DONE')
router.patch('/:id/status', async (req, res, next) => {
  const taskId = req.params.id;   // ID tugas dari URL parameter
  const { status } = req.body;    // Status baru (TODO, IN_PROGRESS, DONE)
  const userId = req.user.id;     // ID user dari Token JWT

  // Validasi sederhana untuk nilai status yang diperbolehkan
  const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    return next(new Error('Status tidak valid. Gunakan: TODO, IN_PROGRESS, atau DONE'));
  }

  try {
    // Update status HANYA JIKA tugas berada di dalam proyek milik user yang login
    const result = await db.query(
      `UPDATE tasks 
       SET status = $1 
       WHERE id = $2 
       AND project_id IN (SELECT id FROM projects WHERE owner_id = $3)
       RETURNING *`,
      [status, taskId, userId]
    );

    // Jika tugas tidak ditemukan atau bukan milik user yang login
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
    next(err); // Lempar error ke errorMiddleware.js
  }
});

// 4. Hapus tugas (Aman & Terisolasi per User)
router.delete('/:id', async (req, res, next) => {
  const taskId = req.params.id;   // ID tugas dari URL parameter
  const userId = req.user.id;     // ID user dari Token JWT

  try {
    // Hapus tugas HANYA JIKA tugas tersebut berada di dalam proyek milik user yang login
    const result = await db.query(
      `DELETE FROM tasks 
      WHERE id = $1 
      AND project_id IN (SELECT id FROM projects WHERE owner_id = $2)
      RETURNING id`,
      [taskId, userId]
    );

    // Jika tidak ada data yang terhapus (misal ID tugas salah / milik user lain)
    if (result.rows.length === 0) {
      res.status(404);
      return next(new Error('Tugas tidak ditemukan atau kamu tidak memiliki akses untuk menghapusnya'));
    }

    res.json({
      success: true,
      message: 'Tugas berhasil dihapus'
    });
  } catch (err) {
    next(err); // Lempar ke errorMiddleware terpusat
  }
});

module.exports = router;