const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LaboratoryResult = sequelize.define('LaboratoryResult', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  request_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  test_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  findings: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  results_data: {
    type: DataTypes.TEXT, // Structured JSON containing test parameters, units, ref ranges, abnormal flags
    allowNull: true,
    get() {
      const raw = this.getDataValue('results_data');
      if (!raw) return null;
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return raw;
      }
    },
    set(val) {
      if (typeof val === 'object' && val !== null) {
        this.setDataValue('results_data', JSON.stringify(val));
      } else {
        this.setDataValue('results_data', val);
      }
    }
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // 'draft', 'preliminary', 'final'
    defaultValue: 'final'
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  doctor_comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  doctor_reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'laboratory_results'
});

module.exports = LaboratoryResult;
