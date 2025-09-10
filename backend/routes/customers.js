const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getDb } = require('../../data/init-db');
const { authenticateToken, authorize, auditLog } = require('../middleware/auth');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Hash SSN for security
const hashSSN = (ssn) => {
  return crypto.createHash('sha256').update(ssn).digest('hex');
};

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, authorize('ADMIN', 'TELLER'), async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = uuidv4();
    
    const {
      customerType,
      firstName,
      lastName,
      businessName,
      email,
      phone,
      ssn,
      ein,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      annualIncome,
      employmentStatus,
      occupation
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO customers (
        customer_id, customer_type, first_name, last_name, business_name,
        email, phone, ssn_hash, ein, date_of_birth,
        address_line1, address_line2, city, state, postal_code,
        annual_income, employment_status, occupation
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    stmt.run(
      customerId,
      customerType,
      firstName,
      lastName,
      businessName,
      email,
      phone,
      ssn ? hashSSN(ssn) : null,
      ein,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      annualIncome,
      employmentStatus,
      occupation
    );
    
    await auditLog(req.user.userId, 'CREATE', 'CUSTOMER', customerId, req.body, req);
    
    res.status(201).json({
      status: 'success',
      data: {
        customerId,
        message: 'Customer created successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{customerId}:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:customerId', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const db = getDb();
    
    // Check access rights
    if (req.user.role === 'CUSTOMER' && req.user.customerId !== customerId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }
    
    const stmt = db.prepare('SELECT * FROM customers WHERE customer_id = ?');
    const customer = stmt.get(customerId);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Remove sensitive data
    delete customer.ssn_hash;
    
    res.json({
      status: 'success',
      data: customer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'TELLER'), async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, kycStatus, riskRating } = req.query;
    const db = getDb();
    
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    
    if (kycStatus) {
      query += ' AND kyc_status = ?';
      params.push(kycStatus);
    }
    
    if (riskRating) {
      query += ' AND risk_rating = ?';
      params.push(riskRating);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const customers = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // Remove sensitive data
    if (customers && Array.isArray(customers) && customers.length > 0) {
      customers.forEach(customer => delete customer.ssn_hash);
    }
    
    // Get total count
    const countParams = kycStatus || riskRating ? params.slice(0, -2) : [];
    const countQuery = 'SELECT COUNT(*) as total FROM customers' + 
                      (kycStatus ? ' WHERE kyc_status = ?' : '') +
                      (riskRating ? (kycStatus ? ' AND' : ' WHERE') + ' risk_rating = ?' : '');
    
    const { total } = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row || { total: 0 });
      });
    });
    
    res.json({
      status: 'success',
      data: customers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{customerId}/kyc:
 *   put:
 *     summary: Update KYC status
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:customerId/kyc', authenticateToken, authorize('ADMIN', 'COMPLIANCE'), async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { kycStatus, notes } = req.body;
    const db = getDb();
    
    const stmt = db.prepare(`
      UPDATE customers 
      SET kyc_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE customer_id = ?
    `);
    
    const result = stmt.run(kycStatus, customerId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
        timestamp: new Date().toISOString()
      });
    }
    
    await auditLog(req.user.userId, 'UPDATE_KYC', 'CUSTOMER', customerId, { kycStatus, notes }, req);
    
    res.json({
      status: 'success',
      message: 'KYC status updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{customerId}/relationships:
 *   get:
 *     summary: Get customer relationships
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:customerId/relationships', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const db = getDb();
    
    // Get all accounts for this customer
    const accountsStmt = db.prepare(`
      SELECT account_id, account_number, account_type, product_name, balance, status 
      FROM accounts 
      WHERE customer_id = ?
    `);
    const accounts = accountsStmt.all(customerId);
    
    // Get all loan applications
    const loansStmt = db.prepare(`
      SELECT application_id, loan_type, requested_amount, status, created_at 
      FROM loan_applications 
      WHERE customer_id = ?
    `);
    const loans = loansStmt.all(customerId);
    
    res.json({
      status: 'success',
      data: {
        customerId,
        accounts,
        loans,
        totalAccounts: accounts.length,
        totalLoans: loans.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;