const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Create single Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// Swagger configuration
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
        url: `http://localhost:3000/api/v1`,
        description: 'Demo server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./backend/simple-app.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Swagger documentation endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mock database
const mockData = {
  users: [
    { user_id: '1', username: 'admin', email: 'admin@demo.com', password: 'admin123', role: 'ADMIN' },
    { user_id: '2', username: 'john.smith0', email: 'john@demo.com', password: 'demo123', role: 'CUSTOMER' }
  ],
  customers: [
    { 
      customer_id: '1', 
      customer_type: 'INDIVIDUAL',
      first_name: 'John', 
      last_name: 'Smith', 
      email: 'john@demo.com', 
      phone: '555-123-4567',
      kyc_status: 'APPROVED',
      risk_rating: 'LOW',
      annual_income: 75000,
      created_at: '2024-01-15T10:00:00Z'
    },
    { 
      customer_id: '2', 
      customer_type: 'INDIVIDUAL',
      first_name: 'Sarah', 
      last_name: 'Johnson', 
      email: 'sarah@demo.com', 
      phone: '555-987-6543',
      kyc_status: 'APPROVED',
      risk_rating: 'LOW',
      annual_income: 85000,
      created_at: '2024-01-20T14:30:00Z'
    }
  ],
  accounts: [
    { 
      account_id: '1', 
      customer_id: '1', 
      account_number: '****1234', 
      account_type: 'CHECKING', 
      product_name: 'Premium Checking',
      balance: 5420.50, 
      available_balance: 5420.50,
      status: 'ACTIVE',
      created_at: '2024-01-15T10:30:00Z'
    },
    { 
      account_id: '2', 
      customer_id: '1', 
      account_number: '****5678', 
      account_type: 'SAVINGS', 
      product_name: 'High Yield Savings',
      balance: 12750.00, 
      available_balance: 12750.00,
      status: 'ACTIVE',
      created_at: '2024-01-15T10:45:00Z'
    },
    { 
      account_id: '3', 
      customer_id: '2', 
      account_number: '****9012', 
      account_type: 'CHECKING', 
      product_name: 'Basic Checking',
      balance: 3250.75, 
      available_balance: 3250.75,
      status: 'ACTIVE',
      created_at: '2024-01-20T15:00:00Z'
    }
  ],
  transactions: [
    {
      transaction_id: '1',
      to_account_id: '1',
      transaction_type: 'DEPOSIT',
      amount: 2500.00,
      description: 'Salary Deposit',
      reference_number: 'REF1704096000000',
      status: 'COMPLETED',
      created_at: '2024-01-25T09:00:00Z'
    },
    {
      transaction_id: '2',
      from_account_id: '1',
      transaction_type: 'WITHDRAWAL',
      amount: 150.00,
      description: 'ATM Withdrawal',
      reference_number: 'REF1704182400000',
      status: 'COMPLETED',
      created_at: '2024-01-24T18:30:00Z'
    },
    {
      transaction_id: '3',
      from_account_id: '1',
      to_account_id: '2',
      transaction_type: 'TRANSFER',
      amount: 1000.00,
      description: 'Transfer to Savings',
      reference_number: 'REF1704268800000',
      status: 'COMPLETED',
      created_at: '2024-01-23T12:15:00Z'
    }
  ]
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive token
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
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = mockData.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({
      status: 'success',
      token: 'demo-jwt-token',
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Core Banking Demo System is running'
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    api: 'online',
    database: 'mock-connected',
    integrations: {
      mulesoft: 'ready',
      salesforce: 'ready'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               customerType:
 *                 type: string
 *                 example: INDIVIDUAL
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: 555-123-4567
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               annualIncome:
 *                 type: number
 *                 example: 75000
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Customer with this email already exists
 *   get:
 *     summary: Get all customers or search by email
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email address
 *     responses:
 *       200:
 *         description: List of customers
 */
app.post('/api/v1/customers', (req, res) => {
  const { customerType, firstName, lastName, email, phone, dateOfBirth, annualIncome } = req.body;
  
  // Check if customer already exists
  const existingCustomer = mockData.customers.find(c => c.email === email);
  if (existingCustomer) {
    return res.status(400).json({
      status: 'error',
      message: 'Customer with this email already exists'
    });
  }
  
  const newCustomer = {
    customer_id: (mockData.customers.length + 1).toString(),
    customer_type: customerType || 'INDIVIDUAL',
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    date_of_birth: dateOfBirth,
    annual_income: annualIncome,
    kyc_status: 'PENDING',
    risk_rating: 'LOW',
    created_at: new Date().toISOString()
  };
  
  mockData.customers.push(newCustomer);
  
  res.status(201).json({
    status: 'success',
    message: 'Customer created successfully',
    data: { customerId: newCustomer.customer_id },
    timestamp: new Date().toISOString()
  });
});

// Get specific customer by ID
app.get('/api/v1/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  
  const customer = mockData.customers.find(c => c.customer_id === customerId);
  
  if (!customer) {
    return res.status(404).json({
      status: 'error',
      message: 'Customer not found',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    status: 'success',
    data: customer,
    timestamp: new Date().toISOString()
  });
});

// Get customers (all or by email query)
app.get('/api/v1/customers', (req, res) => {
  const { email } = req.query;
  
  let customers = mockData.customers;
  
  // Filter by email if provided
  if (email) {
    customers = customers.filter(c => c.email.toLowerCase().includes(email.toLowerCase()));
  }
  
  res.json({
    status: 'success',
    data: customers,
    total: customers.length,
    timestamp: new Date().toISOString()
  });
});

// Create account
app.post('/api/v1/accounts', (req, res) => {
  const { customerEmail, accountType, productName, initialDeposit } = req.body;
  
  // Find customer by email
  const customer = mockData.customers.find(c => c.email === customerEmail);
  if (!customer) {
    return res.status(404).json({
      status: 'error',
      message: 'Customer not found'
    });
  }
  
  const accountNumber = `****${Math.floor(Math.random() * 9000) + 1000}`;
  const newAccount = {
    account_id: (mockData.accounts.length + 1).toString(),
    customer_id: customer.customer_id,
    account_number: accountNumber,
    account_type: accountType,
    product_name: productName,
    balance: initialDeposit || 0,
    available_balance: initialDeposit || 0,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  
  mockData.accounts.push(newAccount);
  
  // Add initial deposit transaction if provided
  if (initialDeposit > 0) {
    const depositTransaction = {
      transaction_id: (mockData.transactions.length + 1).toString(),
      to_account_id: newAccount.account_id,
      transaction_type: 'DEPOSIT',
      amount: initialDeposit,
      description: 'Initial deposit',
      status: 'COMPLETED',
      created_at: new Date().toISOString()
    };
    mockData.transactions.push(depositTransaction);
  }
  
  res.status(201).json({
    status: 'success',
    message: 'Account opened successfully',
    data: { 
      accountId: newAccount.account_id,
      accountNumber: newAccount.account_number
    },
    timestamp: new Date().toISOString()
  });
});

// Get specific account by ID
app.get('/api/v1/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  
  const account = mockData.accounts.find(a => a.account_id === accountId);
  
  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    status: 'success',
    data: account,
    timestamp: new Date().toISOString()
  });
});

// Get accounts (all or by customer)
app.get('/api/v1/accounts', (req, res) => {
  const { customerId, customerEmail } = req.query;
  
  let accounts = mockData.accounts;
  
  // Filter by customer ID if provided
  if (customerId) {
    accounts = accounts.filter(a => a.customer_id === customerId);
  }
  
  // Filter by customer email if provided
  if (customerEmail) {
    const customer = mockData.customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
    if (customer) {
      accounts = accounts.filter(a => a.customer_id === customer.customer_id);
    } else {
      accounts = [];
    }
  }
  
  res.json({
    status: 'success',
    data: accounts,
    total: accounts.length,
    timestamp: new Date().toISOString()
  });
});

// Process transaction
app.post('/api/v1/transactions', (req, res) => {
  const { transactionType, amount, fromAccount, toAccount, description } = req.body;
  
  if (amount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Transaction amount must be positive'
    });
  }
  
  const newTransaction = {
    transaction_id: (mockData.transactions.length + 1).toString(),
    from_account_id: fromAccount || null,
    to_account_id: toAccount || null,
    transaction_type: transactionType,
    amount: amount,
    description: description || `${transactionType} transaction`,
    reference_number: `REF${Date.now()}`,
    status: 'COMPLETED',
    created_at: new Date().toISOString()
  };
  
  mockData.transactions.push(newTransaction);
  
  res.status(201).json({
    status: 'success',
    message: 'Transaction processed successfully',
    data: {
      transactionId: newTransaction.transaction_id,
      referenceNumber: newTransaction.reference_number
    },
    timestamp: new Date().toISOString()
  });
});

// Get specific transaction by ID
app.get('/api/v1/transactions/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  
  const transaction = mockData.transactions.find(t => t.transaction_id === transactionId);
  
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
});

// Get transactions (all or filtered)
app.get('/api/v1/transactions', (req, res) => {
  const { accountId, customerId, limit = 100 } = req.query;
  
  let transactions = mockData.transactions;
  
  // Filter by account ID if provided
  if (accountId) {
    transactions = transactions.filter(t => 
      t.from_account_id === accountId || t.to_account_id === accountId
    );
  }
  
  // Filter by customer ID if provided
  if (customerId) {
    const customerAccounts = mockData.accounts
      .filter(a => a.customer_id === customerId)
      .map(a => a.account_id);
    
    transactions = transactions.filter(t => 
      customerAccounts.includes(t.from_account_id) || 
      customerAccounts.includes(t.to_account_id)
    );
  }
  
  // Apply limit
  transactions = transactions.slice(0, parseInt(limit));
  
  res.json({
    status: 'success',
    data: transactions,
    total: transactions.length,
    timestamp: new Date().toISOString()
  });
});

// Demo scenarios
app.post('/api/v1/demo/scenario/:scenario', (req, res) => {
  const { scenario } = req.params;
  
  const scenarios = {
    'customer-onboarding': {
      message: 'Customer onboarding workflow completed successfully',
      details: [
        '✓ KYC verification initiated',
        '✓ Identity documents validated',
        '✓ Risk assessment completed (Low Risk)',
        '✓ Welcome email sent',
        '✓ Salesforce contact created',
        '✓ MuleSoft workflow triggered'
      ]
    },
    'loan-origination': {
      message: 'Loan application workflow processed',
      details: [
        '✓ Credit bureau inquiry completed (Score: 742)',
        '✓ Income verification processed',
        '✓ Debt-to-income ratio calculated: 28%',
        '✓ Loan approved for $25,000 at 6.5% APR',
        '✓ Funding scheduled for next business day',
        '✓ Salesforce opportunity updated'
      ]
    },
    'compliance-alert': {
      message: 'AML compliance alert generated and processed',
      details: [
        '⚠ Large cash transaction detected: $12,500',
        '✓ Customer risk profile reviewed',
        '✓ Transaction pattern analysis completed',
        '✓ CTR report generated',
        '✓ Compliance case created in Salesforce',
        '✓ Alert assigned to compliance team'
      ]
    },
    'fraud-detection': {
      message: 'Suspicious transaction detected and blocked',
      details: [
        '🚨 Unusual transaction pattern identified',
        '✓ Real-time fraud score: 0.87 (High Risk)',
        '✓ Transaction blocked automatically',
        '✓ Customer notification sent',
        '✓ Fraud case opened',
        '✓ Account placed on security hold'
      ]
    }
  };
  
  const scenarioData = scenarios[scenario];
  if (!scenarioData) {
    return res.status(404).json({
      status: 'error',
      message: 'Unknown scenario'
    });
  }

  // Simulate processing time
  setTimeout(() => {
    res.json({ 
      status: 'success', 
      message: scenarioData.message,
      details: scenarioData.details,
      scenario, 
      timestamp: new Date().toISOString(),
      integrations: {
        mulesoft: 'Workflow triggered',
        salesforce: 'Records updated',
        webhook_delivered: true
      }
    });
  }, Math.random() * 1000 + 500); // Random delay 500-1500ms
});

// Demo reset
app.post('/api/v1/demo/reset', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Demo data reset complete', 
    timestamp: new Date().toISOString() 
  });
});

// Catch-all handler for frontend routes (must be last)
app.get('*', (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/status')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start single server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🏦 Core Banking Demo running on http://localhost:${PORT}`);
  console.log(`💳 Banking UI: http://localhost:${PORT}`);
  console.log(`📚 API Health: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/status`);
});

module.exports = app;