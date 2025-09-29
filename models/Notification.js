const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP'),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('TRANSACTION', 'KYC', 'REFERRAL', 'PRICE_ALERT', 'PROMOTIONAL', 'SYSTEM'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'),
    defaultValue: 'PENDING',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
