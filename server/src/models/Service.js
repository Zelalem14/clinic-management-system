const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { SERVICE_CATEGORIES } = require('../config/constants');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  service_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  service_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(Object.values(SERVICE_CATEGORIES)),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'services'
});

module.exports = Service;
