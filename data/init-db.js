const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../backend/utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../banking-demo.db');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Create or open database
      const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          logger.error('Database connection failed:', err);
          reject(err);
          return;
        }
      });

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements and execute
      const statements = schema
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');

      let completed = 0;
      const total = statements.length;

      statements.forEach((statement, index) => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err && !err.message.includes('already exists')) {
              logger.error('Error executing statement:', err);
              reject(err);
              return;
            }
            
            completed++;
            if (completed === total - 1) { // -1 because last statement might be empty
              logger.info('Database schema initialized successfully');
              
              // Create default admin user if not exists
              db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin'], (err, row) => {
                if (err) {
                  logger.error('Error checking admin user:', err);
                  reject(err);
                  return;
                }
                
                if (!row || row.count === 0) {
                  const bcrypt = require('bcrypt');
                  const { v4: uuidv4 } = require('uuid');
                  
                  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
                  const passwordHash = bcrypt.hashSync(adminPassword, 10);
                  
                  db.run(`
                    INSERT INTO users (user_id, username, email, password_hash, role, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `, [
                    uuidv4(),
                    'admin',
                    'admin@corebanking.demo',
                    passwordHash,
                    'ADMIN',
                    1
                  ], (err) => {
                    if (err) {
                      logger.error('Error creating admin user:', err);
                      reject(err);
                      return;
                    }
                    
                    logger.info('Default admin user created (username: admin)');
                    global.db = db;
                    resolve(db);
                  });
                } else {
                  global.db = db;
                  resolve(db);
                }
              });
            }
          });
        }
      });
    } catch (error) {
      logger.error('Database initialization failed:', error);
      reject(error);
    }
  });
}

// Database helper functions
const getDb = () => {
  if (!global.db) {
    throw new Error('Database not initialized');
  }
  return global.db;
};

const transaction = (callback) => {
  const db = getDb();
  db.run('BEGIN TRANSACTION');
  try {
    const result = callback();
    db.run('COMMIT');
    return result;
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
};

// Export for use in main application
module.exports = { 
  initializeDatabase,
  getDb,
  transaction
};

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}