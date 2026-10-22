const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClinicSetting = sequelize.define('ClinicSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clinic_name: {
    type: DataTypes.STRING,
    defaultValue: 'St. Jude Community Clinic'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: '124 Healthcare Boulevard, City Center'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: '+1 (555) 019-2834'
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: 'info@stjudeclinic.org'
  },
  currency_symbol: {
    type: DataTypes.STRING,
    defaultValue: '$'
  },
  receipt_footer: {
    type: DataTypes.TEXT,
    defaultValue: 'Thank you for visiting St. Jude Clinic. Wishing you a quick and complete recovery!'
  }
}, {
  tableName: 'clinic_settings'
});

module.exports = ClinicSetting;
