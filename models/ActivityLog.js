const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'userid',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING'),
    defaultValue: 'SUCCESS',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userid'],
    },
    {
      fields: ['action'],
    },
    {
      fields: ['createdat'],
    },
  ],
});

module.exports = ActivityLog;
