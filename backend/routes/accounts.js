const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, transaction } = require('../../data/init-db');
const { authenticateToken, authorize, auditLog } = require('../middleware/auth');
const Decimal = require('decimal.js');
const logger = require('../utils/logger');

// Generate account number
const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Open new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const db = getDb();
    const accountId = uuidv4();
    const accountNumber = generateAccountNumber();
    
    const {
      customerId,
      accountType,
      productName,
      initialDeposit = 0,
      interestRate = 0,
      creditLimit = null
    } = req.body;
    
    // Verify customer exists and has approved KYC
    const customerStmt = db.prepare('SELECT kyc_status FROM customers WHERE customer_id = ?');
    const customer = customerStmt.get(customerId);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
        timestamp: new Date().toISOString()
      });
    }
    
    if (customer.kyc_status !== 'APPROVED') {
      return res.status(400).json({
        status: 'error',
        message: 'Customer KYC not approved',
        kycStatus: customer.kyc_status,
        timestamp: new Date().toISOString()
      });
    }
    
    // Create account
    const stmt = db.prepare(`
      INSERT INTO accounts (
        account_id, customer_id, account_number, account_type, product_name,
        balance, available_balance, interest_rate, credit_limit, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    stmt.run(
      accountId,
      customerId,
      accountNumber,
      accountType,
      productName,
      initialDeposit,
      initialDeposit,
      interestRate,
      creditLimit,
      'ACTIVE'
    );
    
    // If initial deposit, create transaction
    if (initialDeposit > 0) {
      const transactionId = uuidv4();
      const transStmt = db.prepare(`
        INSERT INTO transactions (
          transaction_id, to_account_id, transaction_type, amount,
          description, status, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      transStmt.run(
        transactionId,
        accountId,
        'DEPOSIT',
        initialDeposit,
        'Initial deposit',
        'COMPLETED'
      );
    }
    
    await auditLog(req.user.userId, 'OPEN_ACCOUNT', 'ACCOUNT', accountId, req.body, req);
    
    res.status(201).json({
      status: 'success',
      data: {
        accountId,
        accountNumber,
        message: 'Account opened successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: Get account details and balance
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:accountId', authenticateToken, async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const db = getDb();
    
    const stmt = db.prepare(`
      SELECT a.*, c.first_name, c.last_name, c.business_name
      FROM accounts a
      JOIN customers c ON a.customer_id = c.customer_id
      WHERE a.account_id = ?
    `);
    
    const account = stmt.get(accountId);
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check access rights
    if (req.user.role === 'CUSTOMER' && req.user.customerId !== account.customer_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'success',
      data: account,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /accounts/{accountId}/transactions:
 *   get:
 *     summary: Get account transaction history
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:accountId/transactions', authenticateToken, async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    const db = getDb();
    
    // Verify account access
    const accountStmt = db.prepare('SELECT customer_id FROM accounts WHERE account_id = ?');
    const account = accountStmt.get(accountId);
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.user.role === 'CUSTOMER' && req.user.customerId !== account.customer_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }
    
    // Build query
    let query = `
      SELECT * FROM transactions 
      WHERE (from_account_id = ? OR to_account_id = ?)
    `;
    const params = [accountId, accountId];
    
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const stmt = db.prepare(query);
    const transactions = stmt.all(...params);
    
    res.json({
      status: 'success',
      data: transactions,
      pagination: {
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
 * /accounts/{accountId}/status:
 *   put:
 *     summary: Update account status
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:accountId/status', authenticateToken, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { status, reason } = req.body;
    const db = getDb();
    
    const validStatuses = ['ACTIVE', 'CLOSED', 'FROZEN', 'DORMANT'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status',
        validStatuses,
        timestamp: new Date().toISOString()
      });
    }
    
    const stmt = db.prepare(`
      UPDATE accounts 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE account_id = ?
    `);
    
    const result = stmt.run(status, accountId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
        timestamp: new Date().toISOString()
      });
    }
    
    await auditLog(req.user.userId, 'UPDATE_STATUS', 'ACCOUNT', accountId, { status, reason }, req);
    
    res.json({
      status: 'success',
      message: `Account status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /accounts/{accountId}/interest:
 *   post:
 *     summary: Calculate and post interest
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:accountId/interest', authenticateToken, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const db = getDb();
    
    const accountStmt = db.prepare('SELECT balance, interest_rate, account_type FROM accounts WHERE account_id = ?');
    const account = accountStmt.get(accountId);
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Calculate monthly interest
    const balance = new Decimal(account.balance);
    const rate = new Decimal(account.interest_rate).dividedBy(12).dividedBy(100);
    const interest = balance.times(rate).toFixed(2);
    
    if (parseFloat(interest) > 0) {
      transaction(() => {
        // Update account balance
        const updateStmt = db.prepare(`
          UPDATE accounts 
          SET balance = balance + ?, available_balance = available_balance + ?
          WHERE account_id = ?
        `);
        updateStmt.run(interest, interest, accountId);
        
        // Create interest transaction
        const transactionId = uuidv4();
        const transStmt = db.prepare(`
          INSERT INTO transactions (
            transaction_id, to_account_id, transaction_type, amount,
            description, status, processed_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        
        transStmt.run(
          transactionId,
          accountId,
          'INTEREST',
          interest,
          `Monthly interest at ${account.interest_rate}% APR`,
          'COMPLETED'
        );
      });
    }
    
    await auditLog(req.user.userId, 'POST_INTEREST', 'ACCOUNT', accountId, { interest }, req);
    
    res.json({
      status: 'success',
      data: {
        accountId,
        interestPosted: interest,
        newBalance: parseFloat(account.balance) + parseFloat(interest)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;