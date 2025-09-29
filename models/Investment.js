const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Investment = sequelize.define('Investment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'userid',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  goldAmount: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    field: 'goldamount',
    validate: {
      min: 0,
    },
  },
  pricePerGram: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'pricepergram',
    validate: {
      min: 0,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
  },
  investmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'investmentdate',
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'investments',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Investment;

