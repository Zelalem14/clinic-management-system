const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
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
  const dbDir = path.join(__dirname, '../../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const storagePath = process.env.DB_STORAGE || path.join(dbDir, 'clinic.sqlite');

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
