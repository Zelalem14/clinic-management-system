const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LabTestTemplate = sequelize.define('LabTestTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  template_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  template_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'laboratory'
  },
  specimen_type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Venous Blood / Serum'
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'Clinical Chemistry & Hematology'
  },
  default_observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parameters: {
    type: DataTypes.TEXT, // Stored as JSON string
    allowNull: false,
    get() {
      const raw = this.getDataValue('parameters');
      if (!raw) return [];
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return [];
      }
    },
    set(val) {
      if (typeof val === 'object') {
        this.setDataValue('parameters', JSON.stringify(val));
      } else {
        this.setDataValue('parameters', val);
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'lab_test_templates'
});

module.exports = LabTestTemplate;
