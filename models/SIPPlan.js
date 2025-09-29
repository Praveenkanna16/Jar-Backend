const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SIPPlan = sequelize.define('SIPPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nextExecutionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'),
    defaultValue: 'ACTIVE',
  },
  totalExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  successfulExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'sip_plans',
  timestamps: true,
});

module.exports = SIPPlan;
