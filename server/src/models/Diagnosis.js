const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diagnosis = sequelize.define('Diagnosis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  consultation_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('provisional', 'final'),
    defaultValue: 'provisional'
  }
}, {
  tableName: 'diagnoses'
});

module.exports = Diagnosis;
