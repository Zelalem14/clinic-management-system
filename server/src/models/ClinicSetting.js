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
    defaultValue: 'Tena Community Specialty Clinic & Diagnostic Center'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: 'Bole Sub-City, Africa Avenue, Addis Ababa, Ethiopia'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: '+251 11 661 2345'
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: 'info@tenaclinic.et'
  },
  currency_symbol: {
    type: DataTypes.STRING,
    defaultValue: 'ETB'
  },
  receipt_footer: {
    type: DataTypes.TEXT,
    defaultValue: 'እናመሰግናለን! Thank you for choosing Tena Specialty Clinic. Wishing you swift recovery!'
  }
}, {
  tableName: 'clinic_settings'
});

module.exports = ClinicSetting;
