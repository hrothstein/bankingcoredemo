const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const routes = require('./routes');

// Initialize Express apps
const app = express();
const frontendApp = express();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 1000,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Core Banking API',
      version: '1.0.0',
      description: 'Complete Banking System API for MuleSoft Integration Demos',
      contact: {
        name: 'Banking API Support',
        email: 'api@corebanking.demo'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.API_PORT || 3001}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./backend/routes/*.js', './backend/controllers/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Serve React frontend on port 3000
frontendApp.use(express.static(path.join(__dirname, 'public')));
frontendApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes on port 3001
app.use('/api/v1', routes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status endpoint for integration monitoring
app.get('/status', (req, res) => {
  res.json({
    api: 'online',
    database: 'connected',
    cache: 'active',
    integrations: {
      mulesoft: 'ready',
      salesforce: 'ready',
      webhooks: 'enabled'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Initialize database on startup
const { initializeDatabase } = require('../data/init-db');

async function startServer() {
  try {
    // Connect to existing database without re-initializing
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../banking-demo.db');
    
    if (fs.existsSync(DB_PATH)) {
      // Database exists, just connect
      const db = new sqlite3.Database(DB_PATH);
      global.db = db;
      logger.info('Connected to existing database');
    } else {
      // Database doesn't exist, initialize it
      await initializeDatabase();
      logger.info('Database initialized successfully');
    }

    // Start both servers
    const API_PORT = process.env.API_PORT || 3001;
    const UI_PORT = process.env.UI_PORT || 3000;

    app.listen(API_PORT, () => {
      logger.info(`🏦 Banking API running on port ${API_PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${API_PORT}/docs`);
    });

    frontendApp.listen(UI_PORT, () => {
      logger.info(`💳 Banking UI running on port ${UI_PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP servers');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP servers');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;