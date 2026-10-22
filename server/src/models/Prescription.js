const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PRESCRIPTION_STATUS } = require('../config/constants');

const Prescription = sequelize.define('Prescription', {
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
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(Object.values(PRESCRIPTION_STATUS)),
    defaultValue: PRESCRIPTION_STATUS.ACTIVE
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'prescriptions'
});

module.exports = Prescription;
