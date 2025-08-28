const express = require('express');
const router = express.Router();
const { getDb } = require('../../data/init-db');
const logger = require('../utils/logger');

router.post('/reset', async (req, res, next) => {
  try {
    logger.info('Resetting demo data...');
    const { initializeDatabase } = require('../../data/init-db');
    await initializeDatabase();
    
    // Seed demo data
    const seedData = require('../../data/seed-demo-data');
    await seedData();
    
    res.json({ status: 'success', message: 'Demo data reset complete', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

router.post('/scenario/:scenario', async (req, res, next) => {
  try {
    const { scenario } = req.params;
    logger.info(`Running demo scenario: ${scenario}`);
    
    // Implement demo scenarios
    const scenarios = {
      'customer-onboarding': 'New customer journey initiated',
      'loan-origination': 'Loan application process started',
      'compliance-alert': 'Compliance event triggered',
      'fraud-detection': 'Fraud detection scenario activated'
    };
    
    const message = scenarios[scenario] || 'Unknown scenario';
    
    res.json({ status: 'success', message, scenario, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;