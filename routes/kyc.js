const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const kycController = require('../controllers/kycController');

// User KYC routes
router.post('/submit', protect, kycController.uploadKYCDocuments, kycController.submitKYC);
router.get('/status', protect, kycController.getKYCStatus);

// Admin KYC routes
router.get('/pending', protect, kycController.getPendingKYC);
router.put('/verify/:kycId', protect, kycController.verifyKYC);

module.exports = router;
