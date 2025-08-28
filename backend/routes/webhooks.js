const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../data/init-db');
const logger = require('../utils/logger');

router.post('/mulesoft', async (req, res, next) => {
  try {
    const db = getDb();
    const logId = uuidv4();
    
    // Log integration activity
    const stmt = db.prepare(`
      INSERT INTO integration_logs (
        log_id, integration_type, direction, endpoint, method,
        status_code, request_body, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(logId, 'MULESOFT', 'INBOUND', req.path, req.method, 200, JSON.stringify(req.body));
    
    logger.info('MuleSoft webhook received:', req.body);
    
    res.json({ status: 'success', message: 'Webhook processed', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

router.post('/salesforce', async (req, res, next) => {
  try {
    logger.info('Salesforce webhook received:', req.body);
    res.json({ status: 'success', message: 'Webhook processed', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;