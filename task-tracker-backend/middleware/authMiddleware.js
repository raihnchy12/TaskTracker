const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Ambil token dari header 'Authorization: Bearer <TOKEN>'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, // <-- Ditambahkan agar konsisten
      message: 'Akses ditolak, token tidak ditemukan' 
    });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan data user (id, name, email) ke object req
    next(); // Lanjut ke handler route
  } catch (err) {
    return res.status(403).json({ 
      success: false,
      message: 'Token tidak valid atau sudah kadaluwarsa'
  });
  }
}

module.exports = authenticateToken;