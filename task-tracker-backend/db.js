const { Pool } = require('pg');
require('dotenv').config();

// Gunakan connectionString jika DATABASE_URL ada, atau fallback ke variabel terpisah untuk lokal
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Wajib untuk cloud database seperti Neon
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

// Tes koneksi otomatis ke PostgreSQL
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Gagal terhubung ke Database:', err.message);
  } else {
    console.log(`✅ Terhubung ke PostgreSQL Database: "${client.database}" (Port: ${client.port})`);
    release();
  }
});

module.exports = pool;