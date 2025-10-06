const User = require('./User');
const Transaction = require('./Transaction');
const Investment = require('./Investment');
const GoldPrice = require('./GoldPrice');
const KYC = require('./KYC');
const SIPPlan = require('./SIPPlan');
const ActivityLog = require('./ActivityLog');
const Referral = require('./Referral');
const Notification = require('./Notification');

// Define associations
User.hasMany(Transaction, { foreignKey: 'userid' });
Transaction.belongsTo(User, { foreignKey: 'userid' });

User.hasMany(Investment, { foreignKey: 'userid' });
Investment.belongsTo(User, { foreignKey: 'userid' });

Investment.hasMany(Transaction, { foreignKey: 'investmentId' });
Transaction.belongsTo(Investment, { foreignKey: 'investmentId' });

User.hasMany(KYC, { foreignKey: 'userid' });
KYC.belongsTo(User, { foreignKey: 'userid' });

User.hasMany(SIPPlan, { foreignKey: 'userid' });
SIPPlan.belongsTo(User, { foreignKey: 'userid' });

User.hasMany(ActivityLog, { foreignKey: 'userid' });
ActivityLog.belongsTo(User, { foreignKey: 'userid' });

User.hasMany(Referral, { foreignKey: 'referrerId' });
Referral.belongsTo(User, { foreignKey: 'referrerId' });

User.hasMany(Notification, { foreignKey: 'userid' });
Notification.belongsTo(User, { foreignKey: 'userid' });

module.exports = {
  User,
  Transaction,
  Investment,
  GoldPrice,
  KYC,
  SIPPlan,
  ActivityLog,
  Referral,
  Notification,
};
