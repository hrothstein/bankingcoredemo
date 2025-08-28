const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../data/init-db');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/alerts', authenticateToken, authorize('ADMIN', 'COMPLIANCE'), async (req, res, next) => {
  try {
    const db = getDb();
    const { status = 'OPEN', limit = 50 } = req.query;
    
    const stmt = db.prepare(`
      SELECT * FROM compliance_alerts 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const alerts = stmt.all(status, limit);
    
    res.json({ status: 'success', data: alerts, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

router.post('/ofac-check', authenticateToken, async (req, res, next) => {
  try {
    const { name, customerId } = req.body;
    // Simulated OFAC check
    const isMatch = Math.random() < 0.01; // 1% false positive rate
    
    res.json({
      status: 'success',
      data: { isMatch, confidence: isMatch ? 0.85 : 0.0, checkedAt: new Date().toISOString() },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;