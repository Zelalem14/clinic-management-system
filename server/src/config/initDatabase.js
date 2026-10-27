const { sequelize, User } = require('../models');
const seedDatabase = require('../database/seeders/seed');

let initPromise = null;

/**
 * Initializes and syncs database tables, and seeds initial Ethiopian demo accounts
 * if the database is newly initialized. Idempotent across requests.
 */
const initDatabase = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await sequelize.authenticate();
      console.log(`Database connected successfully using '${sequelize.getDialect()}' dialect.`);

      // Sync schema without dropping data
      await sequelize.sync();

      // Check if user accounts exist
      const userCount = await User.count().catch(() => 0);
      if (process.env.AUTO_SEED === 'true' || userCount === 0) {
        console.log(`Initial clinic seeding required (users count: ${userCount}, AUTO_SEED: ${process.env.AUTO_SEED}). Initializing demo data...`);
        const forceDrop = process.env.AUTO_SEED === 'true' && process.env.NODE_ENV !== 'production';
        await seedDatabase(forceDrop);
        console.log('Demo clinic data seeded successfully.');
      }
    } catch (err) {
      console.error('Database initialization failed:', err.message);
      // Reset so next request can retry if it was a transient error
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
};

module.exports = initDatabase;
