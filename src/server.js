require('dotenv').config();
const app = require('./app');
const connectDB = require('./database/connection');
const config = require('./config');

// Handle uncaught exceptions FIRST
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  const redisConfig = require('./config/redis');
  await redisConfig.init();
  const { initQueues } = require('./services/queue.service');
  initQueues();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION:', err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => console.log('Process terminated'));
  });
};

startServer();
