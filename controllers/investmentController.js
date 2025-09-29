const { Investment, Transaction, User } = require('../models');
const goldPriceService = require('../services/goldPrice.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get user portfolio summary
 */
exports.getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user's total investments
    const investments = await Investment.findAll({
      where: { userId },
      include: [{
        model: Transaction,
        attributes: ['id', 'amount', 'status', 'type']
      }]
    });

    // Calculate total gold holdings
    let totalGoldGrams = 0;
    let totalInvestedAmount = 0;
    let activeInvestments = [];

    investments.forEach(investment => {
      if (investment.status === 'ACTIVE') {
        totalGoldGrams += parseFloat(investment.goldQuantity || 0);
        totalInvestedAmount += parseFloat(investment.totalAmount || 0);
        activeInvestments.push({
          id: investment.id,
          goldQuantity: investment.goldQuantity,
          purchasePrice: investment.purchasePrice,
          purchaseDate: investment.createdAt,
          amount: investment.totalAmount
        });
      }
    });

    // Get current gold price
    const currentGoldPrice = await goldPriceService.getCurrentPrice();
    const currentPricePerGram = parseFloat(currentGoldPrice.price);
    
    // Calculate current value
    const currentValue = totalGoldGrams * currentPricePerGram;
    
    // Calculate P&L
    const profitLoss = currentValue - totalInvestedAmount;
    const profitLossPercentage = totalInvestedAmount > 0 
      ? ((profitLoss / totalInvestedAmount) * 100).toFixed(2) 
      : 0;

    const summary = {
      totalGoldGrams: totalGoldGrams.toFixed(4),
      totalInvestedAmount: totalInvestedAmount.toFixed(2),
      currentValue: currentValue.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      profitLossPercentage: parseFloat(profitLossPercentage),
      currentGoldPrice: currentPricePerGram,
      currency: 'INR',
      lastUpdated: currentGoldPrice.createdAt,
      investments: activeInvestments,
      summary: {
        totalInvestments: investments.length,
        activeInvestments: activeInvestments.length,
        averagePurchasePrice: totalGoldGrams > 0 
          ? (totalInvestedAmount / totalGoldGrams).toFixed(2) 
          : 0
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Portfolio summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio summary'
    });
  }
};

/**
 * Sell gold (withdrawal)
 */
exports.sellGold = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { goldGrams, sellType = 'CASH' } = req.body;

    // Validate input
    if (!goldGrams || goldGrams <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gold quantity'
      });
    }

    // Check user's gold balance
    const user = await User.findByPk(userId);
    if (!user || parseFloat(user.goldBalance) < parseFloat(goldGrams)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient gold balance'
      });
    }

    // Get current gold price
    const currentGoldPrice = await goldPriceService.getCurrentPrice();
    const sellPrice = parseFloat(currentGoldPrice.metadata?.sellPrice || currentGoldPrice.price);
    const saleAmount = goldGrams * sellPrice;

    // Create sell transaction
    const transaction = await Transaction.create({
      transactionId: `SELL_${Date.now()}`,
      userId,
      type: 'sell',
      amount: saleAmount,
      goldQuantity: goldGrams,
      pricePerGram: sellPrice,
      status: 'PENDING',
      paymentMethod: 'bank_transfer',
      metadata: {
        sellType,
        goldPrice: sellPrice,
        requestedAt: new Date().toISOString()
      }
    });

    // Update user's gold balance
    user.goldBalance = parseFloat(user.goldBalance) - parseFloat(goldGrams);
    await user.save();

    // Process refund if cash withdrawal
    if (sellType === 'CASH') {
      // Initiate refund through payment gateway
      // This would integrate with PhonePe refund API
      transaction.status = 'COMPLETED';
      transaction.completedAt = new Date();
      await transaction.save();
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        goldSold: goldGrams,
        saleAmount: saleAmount.toFixed(2),
        sellPrice: sellPrice,
        status: transaction.status,
        message: sellType === 'CASH' 
          ? 'Amount will be credited to your account within 2-3 business days'
          : 'Physical gold delivery will be processed within 5-7 business days'
      }
    });
  } catch (error) {
    logger.error('Sell gold error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process gold sale'
    });
  }
};

/**
 * Get investment history
 */
exports.getInvestmentHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { limit = 10, offset = 0, status } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const investments = await Investment.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: Transaction,
        attributes: ['id', 'transactionId', 'status', 'paymentMethod']
      }]
    });

    const total = await Investment.count({ where });

    res.json({
      success: true,
      data: {
        investments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Investment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment history'
    });
  }
};

/**
 * Get gold price history
 */
exports.getGoldPriceHistory = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const priceHistory = await goldPriceService.getPriceHistory(parseInt(days));

    res.json({
      success: true,
      data: {
        prices: priceHistory,
        period: `${days} days`,
        count: priceHistory.length
      }
    });
  } catch (error) {
    logger.error('Gold price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gold price history'
    });
  }
};
