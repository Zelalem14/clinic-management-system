const app = require('./app');
const initDatabase = require('./config/initDatabase');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Start standalone HTTP server when run directly (local development or container)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Clinic Management System API running at http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database on startup:', error.message);
      // Keep server running so error endpoints or logs can be reached
      app.listen(PORT, () => {
        console.log(`Clinic API running with degraded database state at http://localhost:${PORT}`);
      });
    });
}

module.exports = app;
