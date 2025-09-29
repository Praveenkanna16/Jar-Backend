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
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Investment, { foreignKey: 'userId' });
Investment.belongsTo(User, { foreignKey: 'userId' });

Investment.hasMany(Transaction, { foreignKey: 'investmentId' });
Transaction.belongsTo(Investment, { foreignKey: 'investmentId' });

User.hasMany(KYC, { foreignKey: 'userId' });
KYC.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SIPPlan, { foreignKey: 'userId' });
SIPPlan.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ActivityLog, { foreignKey: 'userId' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Referral, { foreignKey: 'referrerId' });
Referral.belongsTo(User, { foreignKey: 'referrerId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

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
