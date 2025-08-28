const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors,
      timestamp: new Date().toISOString()
    });
  }

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      status: 'error',
      message: 'Database constraint violation',
      detail: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  // Business logic errors
  if (err.type === 'INSUFFICIENT_FUNDS') {
    return res.status(400).json({
      status: 'error',
      message: 'Insufficient funds',
      availableBalance: err.availableBalance,
      requestedAmount: err.requestedAmount,
      timestamp: new Date().toISOString()
    });
  }

  if (err.type === 'ACCOUNT_NOT_FOUND') {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      accountId: err.accountId,
      timestamp: new Date().toISOString()
    });
  }

  if (err.type === 'CUSTOMER_NOT_FOUND') {
    return res.status(404).json({
      status: 'error',
      message: 'Customer not found',
      customerId: err.customerId,
      timestamp: new Date().toISOString()
    });
  }

  if (err.type === 'INVALID_ACCOUNT_STATUS') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid account status for this operation',
      currentStatus: err.status,
      timestamp: new Date().toISOString()
    });
  }

  if (err.type === 'COMPLIANCE_BLOCK') {
    return res.status(403).json({
      status: 'error',
      message: 'Transaction blocked for compliance review',
      alertType: err.alertType,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;