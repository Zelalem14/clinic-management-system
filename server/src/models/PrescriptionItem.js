const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  prescription_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  medication_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "500mg"
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "TDS (3 times daily)"
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "5 days"
  },
  route: {
    type: DataTypes.STRING,
    defaultValue: 'Oral'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true // e.g. "Take after meals"
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'prescription_items'
});

module.exports = PrescriptionItem;
