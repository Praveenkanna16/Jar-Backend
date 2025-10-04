const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GoldPrice = sequelize.define('GoldPrice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    validate: {
      isIn: [['USD', 'EUR', 'GBP', 'INR']],
    },
  },
  unit: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'gram',
    validate: {
      isIn: [['gram', 'ounce', 'kilogram']],
    },
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'API',
  },
  is_active: { // Use snake_case to match your table and queries
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'gold_prices',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
  underscored: true, // Ensures all fields use snake_case in DB
});

module.exports = GoldPrice;