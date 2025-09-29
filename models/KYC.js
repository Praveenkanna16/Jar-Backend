const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const KYC = sequelize.define('KYC', {
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
  documentType: {
    type: DataTypes.ENUM('PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE'),
    allowNull: false,
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentImageFront: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  documentImageBack: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'),
    defaultValue: 'PENDING',
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'kyc_documents',
  timestamps: true,
});

module.exports = KYC;
