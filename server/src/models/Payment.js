const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  visit_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receipt_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM(Object.values(PAYMENT_METHODS)),
    defaultValue: PAYMENT_METHODS.CASH
  },
  status: {
    type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
    defaultValue: PAYMENT_STATUS.PENDING
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transaction_reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments'
});

module.exports = Payment;
