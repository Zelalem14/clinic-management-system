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

      // Check if user accounts exist (Staff persistence guard)
      const userCount = await User.count().catch(() => 0);
      if (userCount === 0) {
        console.log(`Initial clinic seeding required (empty database: ${userCount} users). Initializing default demo data...`);
        await seedDatabase(false); // force is strictly false to preserve data integrity
        console.log('Demo clinic data seeded successfully.');
      } else {
        console.log(`Persistent clinic database active with ${userCount} existing staff accounts. Preserving all records.`);
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
