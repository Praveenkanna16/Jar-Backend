const { Sequelize } = require('sequelize');

// Create a new Sequelize instance with configuration from environment variables
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'gold_investment_platform',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat',
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Export the sequelize instance
module.exports = { sequelize };
