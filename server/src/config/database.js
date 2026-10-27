const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'mysql' : 'sqlite');

let sequelize;

if (process.env.DATABASE_URL) {
  // Support standard cloud database connection strings (e.g. TiDB Cloud, Aiven, Railway)
  const isSsl = process.env.DB_SSL !== 'false';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
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
  // SQLite configuration
  // In serverless environments (Vercel / AWS Lambda), the filesystem is read-only except os.tmpdir() (/tmp)
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;
  let storagePath;

  if (process.env.DB_STORAGE) {
    storagePath = process.env.DB_STORAGE;
  } else if (isServerless) {
    storagePath = path.join(os.tmpdir(), 'clinic.sqlite');
  } else {
    const dbDir = path.join(__dirname, '../../../database');
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      storagePath = path.join(dbDir, 'clinic.sqlite');
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
