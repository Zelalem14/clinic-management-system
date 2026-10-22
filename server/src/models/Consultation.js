const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { CONSULTATION_STATUS } = require('../config/constants');

const Consultation = sequelize.define('Consultation', {
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
  consultation_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  examination_findings: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatment_plan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clinical_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(Object.values(CONSULTATION_STATUS)),
    defaultValue: CONSULTATION_STATUS.IN_PROGRESS
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'consultations'
});

module.exports = Consultation;
