function errorHandler(err, req, res, next) {
  console.error('[ERROR LOG]:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Penanganan Error Khusus PostgreSQL (pg)
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation (email sudah ada)
        statusCode = 400;
        message = 'Email sudah terdaftar (terjadi duplikasi data)';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Data referensi tidak ditemukan (Foreign Key Invalid)';
        break;
      case '22P02': // Invalid text representation (salah tipe data ID)
        statusCode = 400;
        message = 'Format input data tidak valid';
        break;
      default:
        statusCode = 500;
        message = 'Database Error';
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;