const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { VISIT_STATUS } = require('../config/constants');

const PatientVisit = sequelize.define('PatientVisit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  visit_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  visit_type: {
    type: DataTypes.STRING,
    defaultValue: 'Outpatient'
  },
  status: {
    type: DataTypes.ENUM(Object.values(VISIT_STATUS)),
    defaultValue: VISIT_STATUS.REGISTERED
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'patient_visits'
});

module.exports = PatientVisit;
