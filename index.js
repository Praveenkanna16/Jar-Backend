const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'PHONEPE_MERCHANT_ID', 'PHONEPE_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Gold Investment Platform API v1',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Import routes after database is connected
    const authRoutes = require('./routes/auth');
    const paymentRoutes = require('./routes/payment');
    const investmentRoutes = require('./routes/investment');
    const kycRoutes = require('./routes/kyc');
    const adminRoutes = require('./routes/admin');
    
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/investments', investmentRoutes);
    app.use('/api/kyc', kycRoutes);
    app.use('/api/admin', adminRoutes);
    
    // Start gold price cron job
    const goldPriceService = require('./services/goldPrice.service');
    goldPriceService.startPriceUpdateCron();
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
