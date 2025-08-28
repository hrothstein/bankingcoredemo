const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../data/init-db');
const { authenticateToken, authorize, auditLog } = require('../middleware/auth');

router.post('/applications', authenticateToken, async (req, res, next) => {
  try {
    const db = getDb();
    const applicationId = uuidv4();
    const { customerId, loanType, requestedAmount, loanPurpose, employmentIncome, termMonths } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO loan_applications (
        application_id, customer_id, loan_type, requested_amount, 
        loan_purpose, employment_income, term_months, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(applicationId, customerId, loanType, requestedAmount, loanPurpose, employmentIncome, termMonths, 'SUBMITTED');
    
    await auditLog(req.user.userId, 'SUBMIT_LOAN', 'LOAN', applicationId, req.body, req);
    
    res.status(201).json({
      status: 'success',
      data: { applicationId, message: 'Loan application submitted' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/applications/:applicationId', authenticateToken, async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM loan_applications WHERE application_id = ?');
    const application = stmt.get(applicationId);
    
    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }
    
    res.json({ status: 'success', data: application, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;