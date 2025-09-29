const axios = require('axios');
const cron = require('node-cron');
const { GoldPrice } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class GoldPriceService {
  constructor() {
    this.currentPrice = null;
    this.lastUpdated = null;
  }

  /**
   * Fetch gold price from external API
   * Using a mock API for demonstration - replace with actual MCX/IBJA API
   */
  async fetchGoldPrice() {
    try {
      // Mock API - Replace with actual gold price API endpoint
      // Example: MCX, IBJA, or any financial data provider
      const mockPrice = 6500 + (Math.random() * 200 - 100); // Mock fluctuation
      
      // In production, use actual API like:
      // const response = await axios.get('https://api.mcx.com/gold/price', {
      //   headers: { 'API-Key': process.env.MCX_API_KEY }
      // });
      // return response.data.price;
      
      return {
        buyPrice: parseFloat(mockPrice.toFixed(2)),
        sellPrice: parseFloat((mockPrice * 0.98).toFixed(2)), // 2% spread
        spotPrice: parseFloat(mockPrice.toFixed(2)),
        currency: 'INR',
        unit: 'gram',
        source: 'MOCK_API'
      };
    } catch (error) {
      logger.error('Failed to fetch gold price:', error);
      throw error;
    }
  }

  /**
   * Update gold price in database
   */
  async updateGoldPrice() {
    try {
      const priceData = await this.fetchGoldPrice();
      
      // Store in database
      const goldPrice = await GoldPrice.create({
        price: priceData.spotPrice,
        currency: priceData.currency,
        unit: priceData.unit,
        metadata: {
          buyPrice: priceData.buyPrice,
          sellPrice: priceData.sellPrice,
          source: priceData.source,
          timestamp: new Date().toISOString()
        }
      });

      this.currentPrice = priceData.spotPrice;
      this.lastUpdated = new Date();

      logger.info(`Gold price updated: ₹${priceData.spotPrice}/gram`);
      return goldPrice;
    } catch (error) {
      logger.error('Failed to update gold price:', error);
      throw error;
    }
  }

  /**
   * Get current gold price
   */
  async getCurrentPrice() {
    try {
      // Get latest price from database
      const latestPrice = await GoldPrice.findOne({
        order: [['createdAt', 'DESC']]
      });

      if (!latestPrice) {
        // If no price in database, fetch and store
        const newPrice = await this.updateGoldPrice();
        return newPrice;
      }

      // Check if price is older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (latestPrice.createdAt < fiveMinutesAgo) {
        // Fetch fresh price
        const newPrice = await this.updateGoldPrice();
        return newPrice;
      }

      return latestPrice;
    } catch (error) {
      logger.error('Failed to get current gold price:', error);
      throw error;
    }
  }

  /**
   * Get price history
   */
  async getPriceHistory(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const prices = await GoldPrice.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        order: [['createdAt', 'ASC']]
      });

      return prices;
    } catch (error) {
      logger.error('Failed to get price history:', error);
      throw error;
    }
  }

  /**
   * Calculate gold value for given grams
   */
  async calculateGoldValue(grams) {
    try {
      const currentPrice = await this.getCurrentPrice();
      const value = parseFloat(grams) * parseFloat(currentPrice.price);
      return {
        grams: parseFloat(grams),
        pricePerGram: parseFloat(currentPrice.price),
        totalValue: value.toFixed(2),
        currency: currentPrice.currency,
        timestamp: currentPrice.createdAt
      };
    } catch (error) {
      logger.error('Failed to calculate gold value:', error);
      throw error;
    }
  }

  /**
   * Start cron job for automatic price updates
   */
  startPriceUpdateCron() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running scheduled gold price update...');
        await this.updateGoldPrice();
      } catch (error) {
        logger.error('Cron job failed to update gold price:', error);
      }
    });

    // Also run immediately on startup
    this.updateGoldPrice().catch(error => {
      logger.error('Initial gold price update failed:', error);
    });

    logger.info('Gold price update cron job started (runs every 5 minutes)');
  }
}

module.exports = new GoldPriceService();
