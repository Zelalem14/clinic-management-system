const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { APPOINTMENT_STATUS } = require('../config/constants');

const Appointment = sequelize.define('Appointment', {
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
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('follow_up', 'new_consultation', 'lab_review'),
    defaultValue: 'follow_up'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(Object.values(APPOINTMENT_STATUS)),
    defaultValue: APPOINTMENT_STATUS.SCHEDULED
  }
}, {
  tableName: 'appointments'
});

module.exports = Appointment;
