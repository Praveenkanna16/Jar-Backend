const { Transaction, User, Investment } = require('../models');
const phonepeService = require('../services/phonepe.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Initiate PhonePe payment
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, type = 'buy', goldQuantity } = req.body;
    const userId = req.user.userId || req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create unique transaction ID
    const transactionId = `TXN_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Create transaction record in database
    const transaction = await Transaction.create({
      transactionId,
      userId,
      type: type === 'buy' ? 'INVESTMENT' : 'DEPOSIT',
      amount,
      goldQuantity: goldQuantity || 0,
      status: 'PENDING',
      paymentMethod: 'phonepe',
      paymentGateway: 'PHONEPE',
      metadata: {
        initiatedAt: new Date().toISOString(),
        userEmail: user.email,
        userName: user.name
      }
    });

    // Initiate payment with PhonePe
    const paymentResponse = await phonepeService.initiatePayment(
      amount,
      transactionId,
      userId.toString(),
      user.phone
    );

    if (paymentResponse.success) {
      // Update transaction with gateway response
      await transaction.update({
        gatewayTransactionId: paymentResponse.data.merchantTransactionId,
        paymentUrl: paymentResponse.data.paymentUrl
      });

      return res.json({
        success: true,
        data: {
          transactionId,
          paymentUrl: paymentResponse.data.paymentUrl,
          amount,
          message: 'Payment initiated successfully'
        }
      });
    } else {
      await transaction.update({ 
        status: 'FAILED',
        failureReason: 'Payment initiation failed'
      });
      throw new Error('Payment initiation failed');
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Payment initiation failed'
    });
  }
};

/**
 * Check payment status
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Get transaction from database
    const transaction = await Transaction.findOne({ 
      where: { transactionId } 
    });
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Check status with PhonePe
    const statusResponse = await phonepeService.checkPaymentStatus(transactionId);

    // Update transaction status in database
    if (statusResponse.success && statusResponse.data) {
      const paymentStatus = statusResponse.data.state;
      let dbStatus = 'pending';
      
      switch(paymentStatus) {
        case 'COMPLETED':
          dbStatus = 'COMPLETED';
          break;
        case 'FAILED':
        case 'DECLINED':
          dbStatus = 'FAILED';
          break;
        case 'PENDING':
          dbStatus = 'PENDING';
          break;
        default:
          dbStatus = 'PENDING';
      }

      await transaction.update({ 
        status: dbStatus,
        gatewayResponse: statusResponse.data,
        completedAt: dbStatus === 'COMPLETED' ? new Date() : null
      });

      // If payment is completed and it's an investment transaction, create investment record
      if (dbStatus === 'COMPLETED' && transaction.type === 'INVESTMENT' && transaction.goldQuantity > 0) {
        await Investment.create({
          userId: transaction.userId,
          goldQuantity: transaction.goldQuantity,
          purchasePrice: transaction.amount / transaction.goldQuantity,
          totalAmount: transaction.amount,
          transactionId: transaction.id
        });
      }
    }

    res.json({
      success: true,
      data: {
        transactionId,
        status: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        paymentDetails: statusResponse.data
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Status check failed' 
    });
  }
};

/**
 * Handle PhonePe webhook callback
 */
exports.handleWebhook = async (req, res) => {
  try {
    const xVerifyHeader = req.headers['x-verify'];
    
    // Validate webhook signature
    const isValid = phonepeService.validateWebhookSignature(req.body, xVerifyHeader);
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    // Decode response
    const decodedResponse = JSON.parse(
      Buffer.from(req.body.response, 'base64').toString('utf-8')
    );

    // Update transaction
    const transaction = await Transaction.findOne({
      where: { transactionId: decodedResponse.data.merchantTransactionId }
    });

    if (transaction) {
      const status = decodedResponse.success ? 'COMPLETED' : 'FAILED';
      await transaction.update({
        status,
        gatewayResponse: decodedResponse,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        failureReason: !decodedResponse.success ? decodedResponse.message : null
      });

      // Create investment record for successful investment transactions
      if (status === 'COMPLETED' && transaction.type === 'INVESTMENT' && transaction.goldQuantity > 0) {
        await Investment.create({
          userId: transaction.userId,
          goldQuantity: transaction.goldQuantity,
          purchasePrice: transaction.amount / transaction.goldQuantity,
          totalAmount: transaction.amount,
          transactionId: transaction.id
        });
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed' 
    });
  }
};

/**
 * Handle payment success callback
 */
exports.handleSuccessCallback = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { merchantTransactionId } = req.body;
    
    const transactionId = orderId || merchantTransactionId;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID not provided'
      });
    }

    // Check and update payment status
    const statusResponse = await phonepeService.checkPaymentStatus(transactionId);
    
    // Update transaction in database
    const transaction = await Transaction.findOne({
      where: { transactionId }
    });
    
    if (transaction && statusResponse.success) {
      await transaction.update({
        status: 'COMPLETED',
        completedAt: new Date(),
        gatewayResponse: statusResponse.data
      });
    }

    // Return success response
    res.json({
      success: true,
      message: 'Payment successful',
      transactionId,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success?transactionId=${transactionId}`
    });
  } catch (error) {
    console.error('Success callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback'
    });
  }
};

/**
 * Get user transactions
 */
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status, type, limit = 10, offset = 0 } = req.query;
    
    // Build query conditions
    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    
    const transactions = await Transaction.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Transaction.count({ where });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
};

/**
 * Initiate refund
 */
exports.initiateRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    
    // Get original transaction
    const originalTransaction = await Transaction.findOne({
      where: { transactionId, status: 'COMPLETED' }
    });
    
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found or not completed'
      });
    }

    // Validate refund amount
    const refundAmount = amount || originalTransaction.amount;
    if (refundAmount > originalTransaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed original transaction amount'
      });
    }

    // Create refund transaction ID
    const refundTransactionId = `REFUND_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Initiate refund with PhonePe
    const refundResponse = await phonepeService.initiateRefund(
      transactionId,
      refundAmount,
      refundTransactionId
    );
    
    // Create refund transaction record
    await Transaction.create({
      transactionId: refundTransactionId,
      userId: originalTransaction.userId,
      type: 'REFUND',
      amount: refundAmount,
      status: refundResponse.success ? 'PENDING' : 'FAILED',
      paymentMethod: 'phonepe',
      metadata: {
        originalTransactionId: transactionId,
        reason,
        initiatedAt: new Date().toISOString()
      }
    });

    res.json({
      success: refundResponse.success,
      data: {
        refundTransactionId,
        amount: refundAmount,
        status: refundResponse.success ? 'initiated' : 'failed',
        message: refundResponse.message
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Refund initiation failed' 
    });
  }
};

// Compatibility exports for existing routes
exports.initializePayment = exports.initiatePayment;
exports.paymentCallback = exports.handleWebhook;
exports.checkStatus = exports.checkPaymentStatus;
