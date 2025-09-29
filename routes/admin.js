const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Apply admin check middleware to all routes
router.use(protect);
router.use(adminController.checkAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Transaction management
router.get('/transactions', adminController.getAllTransactions);

// Activity logs
router.get('/activity-logs', adminController.getActivityLogs);

module.exports = router;
