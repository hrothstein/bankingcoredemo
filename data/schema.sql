-- Core Banking System Database Schema
-- SQLite3 Database with full banking functionality

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Customer management table
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  customer_type TEXT CHECK(customer_type IN ('INDIVIDUAL', 'BUSINESS')) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  ssn_hash TEXT,
  ein TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  kyc_status TEXT CHECK(kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')) DEFAULT 'PENDING',
  risk_rating TEXT CHECK(risk_rating IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
  annual_income DECIMAL(12,2),
  employment_status TEXT,
  occupation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account management table
CREATE TABLE IF NOT EXISTS accounts (
  account_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT DEFAULT '021000021',
  account_type TEXT CHECK(account_type IN ('CHECKING', 'SAVINGS', 'MONEY_MARKET', 'CD', 'CREDIT_CARD', 'PERSONAL_LOAN', 'BUSINESS_LOAN', 'MORTGAGE', 'LINE_OF_CREDIT')) NOT NULL,
  product_name TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0.00,
  available_balance DECIMAL(15,2) DEFAULT 0.00,
  credit_limit DECIMAL(15,2),
  status TEXT CHECK(status IN ('ACTIVE', 'CLOSED', 'FROZEN', 'DORMANT', 'PENDING')) DEFAULT 'ACTIVE',
  interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  opened_date DATE DEFAULT CURRENT_DATE,
  closed_date DATE,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  overdraft_protection BOOLEAN DEFAULT 0,
  minimum_balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Transaction processing table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id TEXT PRIMARY KEY,
  from_account_id TEXT,
  to_account_id TEXT,
  transaction_type TEXT CHECK(transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'ACH', 'WIRE', 'CHECK', 'ATM', 'POS', 'FEE', 'INTEREST', 'ADJUSTMENT')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  reference_number TEXT UNIQUE,
  status TEXT CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED', 'CANCELLED')) DEFAULT 'PENDING',
  failure_reason TEXT,
  metadata JSON,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
  FOREIGN KEY (to_account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Loan origination table
CREATE TABLE IF NOT EXISTS loan_applications (
  application_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  loan_type TEXT CHECK(loan_type IN ('PERSONAL', 'AUTO', 'MORTGAGE', 'BUSINESS', 'STUDENT')) NOT NULL,
  requested_amount DECIMAL(15,2) NOT NULL,
  approved_amount DECIMAL(15,2),
  loan_purpose TEXT,
  employment_income DECIMAL(12,2),
  other_income DECIMAL(12,2),
  monthly_expenses DECIMAL(12,2),
  credit_score INTEGER,
  debt_to_income_ratio DECIMAL(5,4),
  collateral_type TEXT,
  collateral_value DECIMAL(15,2),
  status TEXT CHECK(status IN ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'APPROVED', 'DENIED', 'FUNDED', 'WITHDRAWN')) DEFAULT 'SUBMITTED',
  interest_rate DECIMAL(5,4),
  term_months INTEGER,
  monthly_payment DECIMAL(12,2),
  decision_date TIMESTAMP,
  funded_date TIMESTAMP,
  rejection_reason TEXT,
  underwriter_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Compliance monitoring table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  alert_id TEXT PRIMARY KEY,
  customer_id TEXT,
  account_id TEXT,
  transaction_id TEXT,
  alert_type TEXT CHECK(alert_type IN ('AML', 'CTR', 'OFAC', 'FRAUD', 'KYC', 'SAR', 'HIGH_RISK')) NOT NULL,
  severity TEXT CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL,
  description TEXT NOT NULL,
  trigger_rule TEXT,
  status TEXT CHECK(status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'ESCALATED')) DEFAULT 'OPEN',
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE
);

-- User authentication table
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('CUSTOMER', 'ADMIN', 'TELLER', 'MANAGER', 'COMPLIANCE')) DEFAULT 'CUSTOMER',
  customer_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSON,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Webhooks table for integration events
CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  headers JSON,
  payload JSON,
  status TEXT CHECK(status IN ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING')) DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP,
  next_retry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document storage table
CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  customer_id TEXT,
  loan_application_id TEXT,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (loan_application_id) REFERENCES loan_applications(application_id) ON DELETE CASCADE
);

-- Integration activity log
CREATE TABLE IF NOT EXISTS integration_logs (
  log_id TEXT PRIMARY KEY,
  integration_type TEXT CHECK(integration_type IN ('MULESOFT', 'SALESFORCE', 'WEBHOOK', 'API')) NOT NULL,
  direction TEXT CHECK(direction IN ('INBOUND', 'OUTBOUND')) NOT NULL,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  request_body JSON,
  response_body JSON,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_kyc_status ON customers(kyc_status);
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_loan_applications_customer_id ON loan_applications(customer_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX idx_compliance_alerts_alert_type ON compliance_alerts(alert_type);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);