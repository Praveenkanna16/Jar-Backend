const { User, Transaction, Investment, KYC, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Middleware to check admin role
 */
exports.checkAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Admin access required.'
      });
    }
    
    req.admin = user;
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * Get all users (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { limit = 20, offset = 0, search, kycStatus, role } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (kycStatus) where.kycStatus = kycStatus;
    if (role) where.role = role;
    
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await User.count({ where });
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get all transactions (Admin)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, type, userId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    
    const transactions = await Transaction.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Transaction.count({ where });
    
    // Calculate statistics
    const stats = await Transaction.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
      ],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        transactions,
        statistics: stats,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

/**
 * Get dashboard statistics (Admin)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.count();
    const verifiedUsers = await User.count({ where: { kycStatus: 'VERIFIED' } });
    const activeUsers = await User.count({ where: { isActive: true } });
    
    // Transaction statistics
    const totalTransactions = await Transaction.count();
    const completedTransactions = await Transaction.count({ where: { status: 'COMPLETED' } });
    const pendingTransactions = await Transaction.count({ where: { status: 'PENDING' } });
    
    // Investment statistics
    const totalInvestments = await Investment.count();
    const activeInvestments = await Investment.count({ where: { status: 'ACTIVE' } });
    
    // Revenue statistics
    const revenueStats = await Transaction.findOne({
      where: { status: 'COMPLETED' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageTransactionValue']
      ],
      raw: true
    });
    
    // Recent activity
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'createdAt']
    });
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          active: activeUsers
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions
        },
        investments: {
          total: totalInvestments,
          active: activeInvestments
        },
        revenue: revenueStats,
        recent: {
          transactions: recentTransactions,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Update user status (Admin)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const updates = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role && ['USER', 'ADMIN'].includes(role)) updates.role = role;
    
    await user.update(updates);
    
    // Log admin action
    await ActivityLog.create({
      userId: req.admin.id,
      action: 'UPDATE_USER_STATUS',
      entity: 'User',
      entityId: userId,
      metadata: updates,
      status: 'SUCCESS'
    });
    
    logger.info(`Admin ${req.admin.id} updated user ${userId} status`);
    
    res.json({
      success: true,
      data: {
        userId,
        updates,
        message: 'User status updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

/**
 * Get activity logs (Admin)
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId, action, entity } = req.query;
    
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    
    const logs = await ActivityLog.findAll({
      where,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await ActivityLog.count({ where });
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
};
