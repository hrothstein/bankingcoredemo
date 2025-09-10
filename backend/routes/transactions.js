const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, transaction } = require('../../data/init-db');
const { authenticateToken, authorize, auditLog } = require('../middleware/auth');
const Decimal = require('decimal.js');
const logger = require('../utils/logger');

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Initiate transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const db = getDb();
    const transactionId = uuidv4();
    const referenceNumber = `TXN${Date.now()}`;
    
    const {
      fromAccountId,
      toAccountId,
      amount,
      transactionType,
      description
    } = req.body;
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid transaction amount',
        timestamp: new Date().toISOString()
      });
    }
    
    // Process transaction
    const result = transaction(() => {
      // Get account details
      const fromAccountStmt = fromAccountId ? 
        db.prepare('SELECT * FROM accounts WHERE account_id = ?') : null;
      const toAccountStmt = toAccountId ? 
        db.prepare('SELECT * FROM accounts WHERE account_id = ?') : null;
      
      const fromAccount = fromAccountId ? fromAccountStmt.get(fromAccountId) : null;
      const toAccount = toAccountId ? toAccountStmt.get(toAccountId) : null;
      
      // Validate accounts
      if (fromAccountId && !fromAccount) {
        throw new Error('Source account not found');
      }
      if (toAccountId && !toAccount) {
        throw new Error('Destination account not found');
      }
      
      // Check balance for debit transactions
      if (fromAccount) {
        const balance = new Decimal(fromAccount.available_balance);
        const txAmount = new Decimal(amount);
        
        if (balance.lessThan(txAmount)) {
          const error = new Error('Insufficient funds');
          error.type = 'INSUFFICIENT_FUNDS';
          error.availableBalance = fromAccount.available_balance;
          error.requestedAmount = amount;
          throw error;
        }
        
        // Debit from account
        const debitStmt = db.prepare(`
          UPDATE accounts 
          SET balance = balance - ?, available_balance = available_balance - ?,
              last_activity_date = CURRENT_DATE
          WHERE account_id = ?
        `);
        debitStmt.run(amount, amount, fromAccountId);
      }
      
      // Credit to account
      if (toAccount) {
        const creditStmt = db.prepare(`
          UPDATE accounts 
          SET balance = balance + ?, available_balance = available_balance + ?,
              last_activity_date = CURRENT_DATE
          WHERE account_id = ?
        `);
        creditStmt.run(amount, amount, toAccountId);
      }
      
      // Create transaction record
      const insertStmt = db.prepare(`
        INSERT INTO transactions (
          transaction_id, from_account_id, to_account_id, transaction_type,
          amount, description, reference_number, status, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      insertStmt.run(
        transactionId,
        fromAccountId,
        toAccountId,
        transactionType,
        amount,
        description,
        referenceNumber,
        'COMPLETED'
      );
      
      return { transactionId, referenceNumber };
    });
    
    await auditLog(req.user.userId, 'PROCESS_TRANSACTION', 'TRANSACTION', transactionId, req.body, req);
    
    res.status(201).json({
      status: 'success',
      data: {
        transactionId: result.transactionId,
        referenceNumber: result.referenceNumber,
        status: 'COMPLETED',
        message: 'Transaction processed successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, authorize('ADMIN', 'MANAGER', 'TELLER'), async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, transactionType, status, accountId } = req.query;
    const db = getDb();
    
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    
    if (transactionType) {
      query += ' AND transaction_type = ?';
      params.push(transactionType);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (accountId) {
      query += ' AND (from_account_id = ? OR to_account_id = ?)';
      params.push(accountId, accountId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const transactions = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // Get total count
    const countParams = params.slice(0, -2); // Remove limit and offset
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE 1=1';
    
    if (transactionType) {
      countQuery += ' AND transaction_type = ?';
    }
    if (status) {
      countQuery += ' AND status = ?';
    }
    if (accountId) {
      countQuery += ' AND (from_account_id = ? OR to_account_id = ?)';
    }
    
    const { total } = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row || { total: 0 });
      });
    });
    
    res.json({
      status: 'success',
      data: transactions,
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
 * /transactions/{transactionId}:
 *   get:
 *     summary: Get transaction status
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:transactionId', authenticateToken, async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const db = getDb();
    
    const stmt = db.prepare('SELECT * FROM transactions WHERE transaction_id = ?');
    const transaction = stmt.get(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'success',
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;