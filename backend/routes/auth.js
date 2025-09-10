const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../data/init-db');
const { generateToken, auditLog } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const db = getDb();
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Found user:', row ? { username: row.username, hasPassword: !!row.password_hash } : 'null');
          resolve(row);
        }
      });
    });
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!user.password_hash) {
      console.log('No password hash for user:', username);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
    }
    
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update last login
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Audit log (skip for now to avoid complexity)
    
    res.json({
      status: 'success',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        customerId: user.customer_id
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, customerId } = req.body;
    const db = getDb();
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ? OR email = ?');
    const exists = checkStmt.get(username, email).count;
    
    if (exists) {
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists',
        timestamp: new Date().toISOString()
      });
    }
    
    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    
    // Create user
    const insertStmt = db.prepare(`
      INSERT INTO users (user_id, username, email, password_hash, role, customer_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(userId, username, email, passwordHash, 'CUSTOMER', customerId);
    
    // Generate token
    const token = generateToken({ user_id: userId, username, role: 'CUSTOMER', customer_id: customerId });
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', async (req, res, next) => {
  try {
    // In production, you might want to blacklist the token
    if (req.user) {
      await auditLog(req.user.userId, 'LOGOUT', 'USER', req.user.userId, {}, req);
    }
    
    res.json({
      status: 'success',
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;