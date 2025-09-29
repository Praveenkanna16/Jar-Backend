const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const investmentController = require('../controllers/investmentController');

// Portfolio routes
router.get('/summary', protect, investmentController.getPortfolioSummary);
router.get('/history', protect, investmentController.getInvestmentHistory);

// Gold operations
router.post('/sell', protect, investmentController.sellGold);
router.get('/gold-price/history', investmentController.getGoldPriceHistory);

module.exports = router;
