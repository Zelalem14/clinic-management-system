const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  card_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sex: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergency_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consultation_type: {
    type: DataTypes.STRING,
    defaultValue: 'General Consultation'
  },
  registration_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  current_medications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'patients'
});

module.exports = Patient;
