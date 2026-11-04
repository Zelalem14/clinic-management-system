const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

// Determine dialect: postgres, mysql, or sqlite
let dialect = (process.env.DB_DIALECT || '').toLowerCase().trim();
if (!dialect) {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.toLowerCase();
    dialect = url.startsWith('postgres') ? 'postgres' : 'mysql';
  } else {
    dialect = 'sqlite';
  }
}

let sequelize;

if (process.env.DATABASE_URL) {
  // Support standard cloud database connection strings (e.g. Render Postgres, Supabase, Neon, Railway, TiDB Cloud, Aiven)
  const isSsl = process.env.DB_SSL !== 'false';
  const dbUrl = process.env.DATABASE_URL;
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

  sequelize = new Sequelize(dbUrl, {
    dialect: isPostgres ? 'postgres' : 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: isSsl ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else if (dialect === 'postgres' || dialect === 'postgresql') {
  // PostgreSQL configuration with individual parameters
  const isSsl = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(
    process.env.DB_NAME || 'clinic_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || 5432, 10),
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      dialectOptions: isSsl ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        }
      } : {},
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
} else if (dialect === 'mysql') {
  // MySQL configuration with individual parameters
  const isSsl = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(
    process.env.DB_NAME || 'clinic_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || 3306, 10),
      dialect: 'mysql',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      dialectOptions: isSsl ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        }
      } : {},
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
} else {
  // Permanent SQLite configuration with persistent file resolution
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;
  let storagePath;

  const baseDbDir = path.resolve(__dirname, '../../../database');
  const baseDbFile = path.join(baseDbDir, 'clinic.sqlite');

  if (process.env.DB_STORAGE) {
    storagePath = path.resolve(process.env.DB_STORAGE);
    const customDir = path.dirname(storagePath);
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
  } else if (isServerless) {
    // In serverless environments without cloud DB, seed /tmp with repository database
    storagePath = path.join(os.tmpdir(), 'clinic.sqlite');
    if (fs.existsSync(baseDbFile) && !fs.existsSync(storagePath)) {
      try {
        fs.copyFileSync(baseDbFile, storagePath);
        console.log('Initialized /tmp/clinic.sqlite from repository bundle.');
      } catch (copyErr) {
        console.warn('Could not copy bundled database file to /tmp:', copyErr.message);
      }
    }
  } else {
    // Local / Persistent Host Environment
    try {
      if (!fs.existsSync(baseDbDir)) {
        fs.mkdirSync(baseDbDir, { recursive: true });
      }
      storagePath = baseDbFile;
    } catch (err) {
      console.warn('Could not access database directory, falling back to os.tmpdir():', err.message);
      storagePath = path.join(os.tmpdir(), 'clinic.sqlite');
    }
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

/**
 * Executes a full WAL checkpoint to ensure all uncommitted WAL pages are flushed
 * directly into the primary clinic.sqlite database file on disk.
 */
const checkpointDatabase = async () => {
  if (sequelize && sequelize.getDialect() === 'sqlite') {
    try {
      await sequelize.query('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (err) {
      // Non-fatal, logs diagnostic notice
      console.warn('SQLite WAL checkpoint note:', err.message);
    }
  }
};

sequelize.checkpointDatabase = checkpointDatabase;

module.exports = sequelize;
