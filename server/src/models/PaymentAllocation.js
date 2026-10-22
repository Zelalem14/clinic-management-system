const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentAllocation = sequelize.define('PaymentAllocation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  procedure_request_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allocation_type: {
    type: DataTypes.STRING, // 'card_fee', 'consultation_fee', 'procedure_fee', 'other'
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'payment_allocations'
});

module.exports = PaymentAllocation;
