// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Tes koneksi otomatis ke PostgreSQL saat server dinyalakan
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Gagal terhubung ke Database:', err.message);
  } else {
    console.log(` Terhubung ke PostgreSQL Database: "${client.database}" (Port: ${client.port})`);
    release();
  }
});

module.exports = pool;