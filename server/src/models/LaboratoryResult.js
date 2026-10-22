const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LaboratoryResult = sequelize.define('LaboratoryResult', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  request_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  test_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  findings: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  results_data: {
    type: DataTypes.TEXT, // Structured JSON or text representation
    allowNull: true
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('preliminary', 'final'),
    defaultValue: 'final'
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'laboratory_results'
});

module.exports = LaboratoryResult;
