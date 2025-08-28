const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const customerRoutes = require('./customers');
const accountRoutes = require('./accounts');
const transactionRoutes = require('./transactions');
const loanRoutes = require('./loans');
const complianceRoutes = require('./compliance');
const webhookRoutes = require('./webhooks');
const demoRoutes = require('./demo');

// Mount routes
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/loans', loanRoutes);
router.use('/compliance', complianceRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/demo', demoRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Core Banking API v1.0',
    status: 'operational',
    endpoints: {
      auth: '/api/v1/auth',
      customers: '/api/v1/customers',
      accounts: '/api/v1/accounts',
      transactions: '/api/v1/transactions',
      loans: '/api/v1/loans',
      compliance: '/api/v1/compliance',
      webhooks: '/api/v1/webhooks',
      demo: '/api/v1/demo',
      documentation: '/docs'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;