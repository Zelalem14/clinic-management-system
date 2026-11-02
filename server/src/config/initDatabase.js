const { sequelize, User, Patient } = require('../models');
const seedDatabase = require('../database/seeders/seed');

let initPromise = null;

/**
 * Initializes and syncs database tables, preserving all permanent patient records
 * and staff user accounts. Idempotent across requests.
 */
const initDatabase = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await sequelize.authenticate();
      console.log(`Database connected successfully using '${sequelize.getDialect()}' dialect.`);

      // Sync schema safely without dropping existing tables or data
      await sequelize.sync();

      // Check existing accounts and patient counts
      const userCount = await User.count().catch(() => 0);
      const patientCount = await Patient.count().catch(() => 0);

      if (userCount === 0 && patientCount === 0) {
        console.log(`Initial clinic setup: empty database (0 users, 0 patients). Seeding initial demo data safely...`);
        await seedDatabase(false); // force: false strictly preserves all schema and never drops tables
        console.log('Demo clinic data seeded successfully.');
      } else {
        console.log(`Persistent clinic database active: ${userCount} staff accounts and ${patientCount} registered patients safely preserved.`);
      }
    } catch (err) {
      console.error('Database initialization failed:', err.message);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
};

module.exports = initDatabase;
