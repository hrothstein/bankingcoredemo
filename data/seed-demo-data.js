const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getDb, transaction } = require('./init-db');
const logger = require('../backend/utils/logger');

// Demo data generators
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
const companies = ['Tech Solutions Inc', 'Global Trading LLC', 'Innovation Labs', 'Digital Services Corp', 'Cloud Systems'];

function generatePhone() {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateSSN() {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

async function seedDemoData() {
  const db = getDb();
  logger.info('Starting demo data seeding...');

  try {
    // Clear existing demo data (except admin user)
    db.run('DELETE FROM transactions');
    db.run('DELETE FROM loan_applications');
    db.run('DELETE FROM compliance_alerts');
    db.run('DELETE FROM accounts');
    db.run('DELETE FROM users WHERE role = "CUSTOMER"');
    db.run('DELETE FROM customers');

    // Create customers
    const customers = [];
    for (let i = 0; i < 50; i++) {
      const customerId = uuidv4();
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const cityIndex = Math.floor(Math.random() * cities.length);
      
      const customer = {
        customerId,
        customerType: i < 40 ? 'INDIVIDUAL' : 'BUSINESS',
        firstName: i < 40 ? firstName : null,
        lastName: i < 40 ? lastName : null,
        businessName: i >= 40 ? companies[Math.floor(Math.random() * companies.length)] : null,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: generatePhone(),
        ssnHash: i < 40 ? bcrypt.hashSync(generateSSN(), 10) : null,
        ein: i >= 40 ? `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}` : null,
        dateOfBirth: i < 40 ? generateDate(new Date(1950, 0, 1), new Date(2000, 0, 1)) : null,
        addressLine1: `${Math.floor(Math.random() * 9999) + 1} Main Street`,
        city: cities[cityIndex],
        state: states[cityIndex],
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        kycStatus: ['APPROVED', 'APPROVED', 'APPROVED', 'PENDING'][Math.floor(Math.random() * 4)],
        riskRating: ['LOW', 'LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 4)],
        annualIncome: Math.floor(Math.random() * 150000) + 30000
      };
      
      customers.push(customer);
      
      // Insert customer
      const stmt = db.prepare(`
        INSERT INTO customers (
          customer_id, customer_type, first_name, last_name, business_name,
          email, phone, ssn_hash, ein, date_of_birth,
          address_line1, city, state, postal_code,
          kyc_status, risk_rating, annual_income
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        customer.customerId, customer.customerType, customer.firstName, customer.lastName,
        customer.businessName, customer.email, customer.phone, customer.ssnHash, customer.ein,
        customer.dateOfBirth, customer.addressLine1, customer.city, customer.state,
        customer.postalCode, customer.kycStatus, customer.riskRating, customer.annualIncome
      );
      
      // Create user account
      const userId = uuidv4();
      const username = customer.businessName ? 
        customer.businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + i :
        `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}${i}`;
      const passwordHash = bcrypt.hashSync('demo123', 10);
      
      const userStmt = db.prepare(`
        INSERT INTO users (user_id, username, email, password_hash, role, customer_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      userStmt.run(userId, username, customer.email, passwordHash, 'CUSTOMER', customer.customerId);
    }

    logger.info(`Created ${customers.length} customers`);

    // Create accounts
    const accounts = [];
    const accountTypes = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'PERSONAL_LOAN', 'MORTGAGE'];
    
    customers.forEach((customer, index) => {
      // Each customer gets 1-3 accounts
      const numAccounts = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numAccounts; j++) {
        const accountId = uuidv4();
        const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
        const balance = Math.floor(Math.random() * 50000) + 1000;
        
        const account = {
          accountId,
          customerId: customer.customerId,
          accountNumber: `${Date.now()}${index}${j}`,
          accountType,
          productName: `${accountType} Account`,
          balance,
          availableBalance: balance,
          interestRate: accountType === 'SAVINGS' ? 2.5 : accountType === 'MORTGAGE' ? 3.75 : 0,
          status: 'ACTIVE'
        };
        
        accounts.push(account);
        
        const stmt = db.prepare(`
          INSERT INTO accounts (
            account_id, customer_id, account_number, account_type, product_name,
            balance, available_balance, interest_rate, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          account.accountId, account.customerId, account.accountNumber,
          account.accountType, account.productName, account.balance,
          account.availableBalance, account.interestRate, account.status
        );
      }
    });

    logger.info(`Created ${accounts.length} accounts`);

    // Create transactions
    const transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'ATM', 'POS'];
    let transactionCount = 0;
    
    accounts.forEach(account => {
      // Each account gets 10-30 transactions
      const numTransactions = Math.floor(Math.random() * 20) + 10;
      
      for (let i = 0; i < numTransactions; i++) {
        const transactionId = uuidv4();
        const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const amount = Math.floor(Math.random() * 5000) + 10;
        const isDebit = ['WITHDRAWAL', 'PAYMENT', 'POS'].includes(transactionType);
        
        const stmt = db.prepare(`
          INSERT INTO transactions (
            transaction_id, from_account_id, to_account_id, transaction_type,
            amount, description, reference_number, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
        `);
        
        stmt.run(
          transactionId,
          isDebit ? account.accountId : null,
          !isDebit ? account.accountId : null,
          transactionType,
          amount,
          `${transactionType} transaction`,
          `REF${Date.now()}${i}`,
          'COMPLETED',
          Math.floor(Math.random() * 90) // Random date within last 90 days
        );
        
        transactionCount++;
      }
    });

    logger.info(`Created ${transactionCount} transactions`);

    // Create loan applications
    let loanCount = 0;
    customers.slice(0, 20).forEach(customer => {
      const applicationId = uuidv4();
      const loanTypes = ['PERSONAL', 'AUTO', 'MORTGAGE', 'BUSINESS'];
      const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
      const requestedAmount = Math.floor(Math.random() * 100000) + 10000;
      
      const stmt = db.prepare(`
        INSERT INTO loan_applications (
          application_id, customer_id, loan_type, requested_amount,
          loan_purpose, employment_income, credit_score, status, term_months
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        applicationId,
        customer.customerId,
        loanType,
        requestedAmount,
        `${loanType} loan for personal use`,
        customer.annualIncome,
        Math.floor(Math.random() * 300) + 550, // Credit score between 550-850
        ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'FUNDED'][Math.floor(Math.random() * 5)],
        loanType === 'MORTGAGE' ? 360 : loanType === 'AUTO' ? 60 : 36
      );
      
      loanCount++;
    });

    logger.info(`Created ${loanCount} loan applications`);

    // Create compliance alerts
    let alertCount = 0;
    accounts.slice(0, 15).forEach(account => {
      if (Math.random() < 0.3) { // 30% chance of alert
        const alertId = uuidv4();
        const alertTypes = ['AML', 'CTR', 'FRAUD', 'HIGH_RISK'];
        
        const stmt = db.prepare(`
          INSERT INTO compliance_alerts (
            alert_id, account_id, alert_type, severity,
            description, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
        `);
        
        stmt.run(
          alertId,
          account.accountId,
          alertTypes[Math.floor(Math.random() * alertTypes.length)],
          ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
          'Suspicious activity detected',
          ['OPEN', 'INVESTIGATING', 'RESOLVED'][Math.floor(Math.random() * 3)],
          Math.floor(Math.random() * 30) // Random date within last 30 days
        );
        
        alertCount++;
      }
    });

    logger.info(`Created ${alertCount} compliance alerts`);
    logger.info('Demo data seeding completed successfully!');

    return {
      customers: customers.length,
      accounts: accounts.length,
      transactions: transactionCount,
      loans: loanCount,
      alerts: alertCount
    };

  } catch (error) {
    logger.error('Error seeding demo data:', error);
    throw error;
  }
}

module.exports = seedDemoData;

// Run if called directly
if (require.main === module) {
  // Initialize database connection and then seed data
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../banking-demo.db');
  const db = new sqlite3.Database(DB_PATH);
  global.db = db;
  
  seedDemoData()
    .then((stats) => {
      console.log('✅ Demo data seeded successfully!');
      console.log('Statistics:', stats);
      
      // Close database connection properly
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('❌ Demo data seeding failed:', error);
      // Close database connection on error too
      db.close(() => {
        process.exit(1);
      });
    });
}