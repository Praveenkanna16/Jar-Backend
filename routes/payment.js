const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  initiatePayment,
  checkPaymentStatus,
  handleWebhook,
  handleSuccessCallback,
  getUserTransactions,
  initiateRefund
} = require('../controllers/paymentController');

// Main payment routes
router.post('/initiate', protect, initiatePayment);
router.get('/status/:transactionId', protect, checkPaymentStatus);
router.get('/transactions', protect, getUserTransactions);
router.post('/refund', protect, initiateRefund);

// PhonePe callback routes (no auth required as they come from PhonePe)
router.post('/phonepe/webhook', handleWebhook);
router.post('/phonepe/success', handleSuccessCallback);

// Legacy compatibility routes
router.post('/create', protect, initiatePayment);
router.post('/callback', handleWebhook);

module.exports = router;
