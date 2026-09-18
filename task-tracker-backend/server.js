const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const authenticateToken = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// 1. Core Middlewares
app.use(cors());
app.use(express.json());

// 2. Health Check / Root Route (HARUS DI ATAS 404 HANDLER)
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

// 4. Handling Route Not Found (404)
app.use((req, res, next) => {
  const error = new Error(`Endpoint ${req.originalUrl} tidak ditemukan`);
  res.status(404);
  next(error);
});

// 5. Global Error Handler (HARUS PALING BAWAH)
app.use(errorHandler);

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});