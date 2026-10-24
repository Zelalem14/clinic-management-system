const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { REQUEST_STATUS, SERVICE_CATEGORIES } = require('../config/constants');

const ProcedureRequest = sequelize.define('ProcedureRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  visit_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(Object.values(SERVICE_CATEGORIES)),
    defaultValue: SERVICE_CATEGORIES.LABORATORY
  },
  clinical_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('routine', 'urgent'),
    defaultValue: 'routine'
  },
  status: {
    type: DataTypes.ENUM(Object.values(REQUEST_STATUS)),
    defaultValue: REQUEST_STATUS.AWAITING_PAYMENT
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'procedure_requests'
});

module.exports = ProcedureRequest;
