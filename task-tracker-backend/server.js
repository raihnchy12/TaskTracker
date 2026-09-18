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

// Handle CORS untuk semua origin
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Tracker API Server is running smoothly 🚀'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

app.use((req, res, next) => {
  const error = new Error(`Endpoint ${req.originalUrl} tidak ditemukan`);
  res.status(404);
  next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});