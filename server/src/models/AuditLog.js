const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false // e.g. 'PAYMENT_APPROVED', 'PATIENT_REGISTERED', 'PROCEDURE_ORDERED'
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false // e.g. 'Payment', 'Patient', 'Consultation', 'User'
  },
  entity_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'audit_logs'
});

module.exports = AuditLog;
