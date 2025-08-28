const jwt = require('jsonwebtoken');
const { getDb } = require('../../data/init-db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.user_id,
      username: user.username,
      role: user.role,
      customerId: user.customer_id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];
  
  // Check for API key first (for system integrations)
  if (apiKey) {
    if (apiKey === process.env.API_KEY || apiKey === 'demo-api-key') {
      req.user = { role: 'ADMIN', isApiKey: true };
      return next();
    }
  }
  
  // Check for Bearer token
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      timestamp: new Date().toISOString()
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt:', err.message);
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
    
    req.user = user;
    next();
  });
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        required: roles,
        userRole: req.user.role,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

// Log audit trail
const auditLog = async (userId, action, resourceType, resourceId, details, req) => {
  try {
    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      uuidv4(),
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
  } catch (error) {
    logger.error('Audit log error:', error);
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  authorize,
  auditLog
};