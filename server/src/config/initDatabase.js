const { sequelize, User, Patient } = require('../models');
const seedDatabase = require('../database/seeders/seed');
const seedLabTemplates = require('../database/seeders/seedLabTemplates');
const { createBackup } = require('../services/backupService');

let initPromise = null;

/**
 * Initializes and syncs database tables, preserving all permanent patient records
 * and staff user accounts. Idempotent across server restarts.
 */
const initDatabase = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await sequelize.authenticate();
      const dialect = sequelize.getDialect();
      console.log(`Database connected successfully using '${dialect}' dialect.`);

      // Configure SQLite for high durability, zero data loss, and concurrent access
      if (dialect === 'sqlite') {
        try {
          await sequelize.query('PRAGMA journal_mode = WAL;');
          await sequelize.query('PRAGMA synchronous = NORMAL;');
          await sequelize.query('PRAGMA foreign_keys = ON;');
          await sequelize.query('PRAGMA busy_timeout = 10000;');
          console.log('SQLite durability active: WAL journal mode, Normal sync, Foreign keys enabled.');
        } catch (pragmaErr) {
          console.warn('Could not set SQLite PRAGMA directives:', pragmaErr.message);
        }
      }

      // Safe schema synchronization without dropping existing tables or data
      await sequelize.sync();

      // Ensure backward-compatible columns exist on laboratory_results
      try {
        await sequelize.query('ALTER TABLE laboratory_results ADD COLUMN doctor_comments TEXT;');
      } catch (e) { /* column exists */ }
      try {
        await sequelize.query('ALTER TABLE laboratory_results ADD COLUMN doctor_reviewed_at DATETIME;');
      } catch (e) { /* column exists */ }

      // Ensure ready-made structured laboratory templates and services exist
      await seedLabTemplates();

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

      // Trigger automatic backup snapshot on startup to safeguard all records
      try {
        await createBackup();
      } catch (backupErr) {
        console.warn('Startup database backup skipped:', backupErr.message);
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
