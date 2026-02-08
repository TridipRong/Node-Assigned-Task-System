require('dotenv').config();
const express = require('express');
const pool = require('./db');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/errorHandler');
require('./cron/timeout');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8080;

pool.query('SELECT 1').then(() => {
  console.log('✅ PostgreSQL connected (Main Server)');
  app.listen(PORT, () => {
    console.log(`🚀 Main Server running on ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ PostgreSQL connection failed:', err.message);
  process.exit(1);
});
