const app = require('./app');
const { sequelize, User } = require('./models');
const seedDatabase = require('./database/seeders/seed');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log(`Database connected successfully using '${sequelize.getDialect()}' dialect.`);

    // Sync models without altering existing data
    await sequelize.sync();

    // Check if initial seeding is needed (empty database or AUTO_SEED=true)
    const userCount = await User.count().catch(() => 0);
    if (process.env.AUTO_SEED === 'true' || userCount === 0) {
      console.log(`Initial clinic seeding required (users count: ${userCount}, AUTO_SEED: ${process.env.AUTO_SEED}). Initializing demo data...`);
      // Never use force: true in production unless explicitly requested in non-prod
      const forceDrop = process.env.AUTO_SEED === 'true' && process.env.NODE_ENV !== 'production';
      await seedDatabase(forceDrop);
    }

    app.listen(PORT, () => {
      console.log(`Clinic Management System API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
