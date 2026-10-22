const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedureRequestItem = sequelize.define('ProcedureRequestItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('awaiting_payment', 'paid', 'completed', 'cancelled'),
    defaultValue: 'awaiting_payment'
  }
}, {
  tableName: 'procedure_request_items'
});

module.exports = ProcedureRequestItem;
