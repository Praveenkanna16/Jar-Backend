#!/usr/bin/env node
const { sequelize } = require('../config/db');
const models = require('../models');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models
    if (process.env.NODE_ENV === 'production') {
      // In production, only sync if tables don't exist
      await sequelize.sync({ alter: false });
      console.log('✅ Database synchronized (production mode)');
    } else {
      // In development, alter tables to match models
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized (development mode)');
    }
    
    // List all tables
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
