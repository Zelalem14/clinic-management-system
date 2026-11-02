const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'mysql' : 'sqlite');

let sequelize;

if (process.env.DATABASE_URL) {
  // Support standard cloud database connection strings (e.g. TiDB Cloud, Aiven, Railway, Render Postgres/MySQL)
  const isSsl = process.env.DB_SSL !== 'false';
  const dbUrl = process.env.DATABASE_URL;
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  
  sequelize = new Sequelize(dbUrl, {
    dialect: isPostgres ? 'postgres' : 'mysql',
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
  });
} else if (dialect === 'mysql') {
  const isSsl = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(
    process.env.DB_NAME || 'clinic_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
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
  // SQLite configuration with persistent file resolution
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;
  let storagePath;

  const baseDbDir = path.resolve(__dirname, '../../../database');
  const baseDbFile = path.join(baseDbDir, 'clinic.sqlite');

  if (process.env.DB_STORAGE) {
    storagePath = path.resolve(process.env.DB_STORAGE);
  } else if (isServerless) {
    // In serverless environments (e.g. Vercel), only os.tmpdir() is writable
    storagePath = path.join(os.tmpdir(), 'clinic.sqlite');

    // If a pre-seeded clinic.sqlite exists in the repository, seed /tmp with it so existing records are kept
    if (fs.existsSync(baseDbFile) && !fs.existsSync(storagePath)) {
      try {
        fs.copyFileSync(baseDbFile, storagePath);
        console.log('Seeded /tmp/clinic.sqlite from repository database file.');
      } catch (copyErr) {
        console.warn('Could not copy bundled database file to /tmp:', copyErr.message);
      }
    }
  } else {
    // Local / Persistent Container Environment
    try {
      if (!fs.existsSync(baseDbDir)) {
        fs.mkdirSync(baseDbDir, { recursive: true });
      }
      storagePath = baseDbFile;
    } catch (err) {
      console.warn('Could not write to local database directory, falling back to os.tmpdir():', err.message);
      storagePath = path.join(os.tmpdir(), 'clinic.sqlite');
    }
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

module.exports = sequelize;
