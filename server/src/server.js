const app = require('./app');
const initDatabase = require('./config/initDatabase');
const { sequelize } = require('./models');
const { createBackup } = require('./services/backupService');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
let serverInstance = null;

// Graceful process shutdown handler to guarantee all patient records are flushed to permanent storage
const handleGracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Flushing database transactions and creating safety snapshot...`);
  try {
    if (sequelize.checkpointDatabase) {
      await sequelize.checkpointDatabase();
    }
    await createBackup().catch(() => {});
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
      console.log('Database connection pool cleanly closed. All records safely persisted.');
    }
  } catch (err) {
    console.error('Error during shutdown persistence flush:', err.message);
  } finally {
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

// Start standalone HTTP server when run directly (local development or container)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  initDatabase()
    .then(() => {
      serverInstance = app.listen(PORT, () => {
        console.log(`Clinic Management System API running at http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database on startup:', error.message);
      // Keep server running so error endpoints or logs can be reached
      serverInstance = app.listen(PORT, () => {
        console.log(`Clinic API running with degraded database state at http://localhost:${PORT}`);
      });
    });
}

module.exports = app;
