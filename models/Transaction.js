const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
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
  investmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'investmentid',
    references: {
      model: 'investments',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'DEPOSIT',
      'WITHDRAWAL',
      'INVESTMENT',
      'REFUND',
      'FEE',
      'buy',
      'sell',
      'refund'
    ),
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique transaction identifier'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  goldAmount: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    field: 'goldamount',
  },
  pricePerGram: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'pricepergram',
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'REFUNDED'
    ),
    defaultValue: 'PENDING',
  },
  paymentGateway: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., PHONEPE, RAZORPAY, etc.'
  },
  paymentGatewayTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_gateway_transaction_id',
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transactiondate',
    defaultValue: DataTypes.NOW,
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'External reference ID',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional transaction details or gateway response',
  },
  goldQuantity: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    field: 'gold_quantity'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_method'
  },
  paymentUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'payment_url'
  },
  gatewayTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'gateway_transaction_id'
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'gateway_response'
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'failure_reason'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Transaction;

