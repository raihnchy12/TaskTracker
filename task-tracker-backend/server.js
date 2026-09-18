const express = require('express');
require('dotenv').config();
require('./db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const authenticateToken = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// 1. Force Headers CORS Manual di Paling Atas (Bypass Semua Middleware)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Jika browser kirim Preflight (OPTIONS), langsung jawab HTTP 200 OK
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// 2. Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Tracker API Server is running smoothly 🚀'
  });
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

// 4. Handling 404
app.use((req, res, next) => {
  const error = new Error(`Endpoint ${req.originalUrl} tidak ditemukan`);
  res.status(404);
  next(error);
});

// 5. Global Error Handler
app.use(errorHandler);

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});