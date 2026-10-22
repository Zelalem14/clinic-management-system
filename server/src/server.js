const app = require('./app');
const { sequelize } = require('./models');
const seedDatabase = require('./database/seeders/seed');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log(`Database connected successfully using '${sequelize.getDialect()}' dialect.`);

    // If AUTO_SEED is enabled or database is empty, seed initial data
    if (process.env.AUTO_SEED === 'true') {
      console.log('AUTO_SEED is enabled. Seeding demo database...');
      await seedDatabase();
    } else {
      // Sync models without altering existing data
      await sequelize.sync();
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
