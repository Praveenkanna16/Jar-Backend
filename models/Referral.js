const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  referrerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  referredUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  rewardAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  bonusGoldGrams: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'referrals',
  timestamps: true,
});

module.exports = Referral;
