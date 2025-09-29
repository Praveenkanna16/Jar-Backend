const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: /^[0-9]{10,15}$/,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true,
    },
  },
  goldBalance: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    field: 'goldbalance'
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN', 'SUPER_ADMIN'),
    defaultValue: 'USER',
  },
  kycStatus: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  kycVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  referredBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = User;
