# Database Schema Documentation

## Overview
This document describes the PostgreSQL database schema for the Gold Investment Platform.

## Database Tables

### 1. Users Table (`users`)
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the user |
| name | VARCHAR(100) | NOT NULL, CHECK (length >= 2) | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE, CHECK (valid email) | User's email address |
| password | VARCHAR(255) | NOT NULL, CHECK (length >= 6) | Hashed password |
| isActive | BOOLEAN | DEFAULT true | Account status |
| lastLogin | TIMESTAMP | NULL | Last login timestamp |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_users_email` - For fast email lookups
- `idx_users_isActive` - For filtering active users

### 2. Gold Prices Table (`gold_prices`)
Stores current and historical gold price data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| price | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Gold price value |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code (USD, EUR, GBP, INR) |
| unit | VARCHAR(10) | NOT NULL, DEFAULT 'gram' | Unit of measurement |
| source | VARCHAR(50) | NOT NULL, DEFAULT 'API' | Price source |
| isActive | BOOLEAN | DEFAULT true | Price status |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_gold_prices_currency` - For filtering by currency
- `idx_gold_prices_isActive` - For filtering active prices

### 3. Investments Table (`investments`)
Stores user investment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| amount | DECIMAL(12,2) | NOT NULL, CHECK (>= 0) | Investment amount |
| goldAmount | DECIMAL(10,4) | NOT NULL, CHECK (>= 0) | Amount of gold purchased |
| pricePerGram | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Price per gram at time of investment |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency used |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Investment status |
| investmentDate | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date of investment |
| notes | TEXT | NULL | Additional notes |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_investments_userId` - For user's investments
- `idx_investments_status` - For filtering by status
- `idx_investments_investmentDate` - For date-based queries

### 4. Transactions Table (`transactions`)
Stores all transaction history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| investmentId | UUID | NULL, FOREIGN KEY | Reference to investments table |
| type | VARCHAR(20) | NOT NULL | Transaction type (buy, sell, deposit, withdrawal) |
| amount | DECIMAL(12,2) | NOT NULL | Transaction amount |
| goldAmount | DECIMAL(10,4) | NULL | Amount of gold involved |
| pricePerGram | DECIMAL(10,2) | NULL | Price per gram at transaction time |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency used |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Transaction status |
| transactionDate | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Transaction date |
| reference | VARCHAR(100) | NULL | Transaction reference number |
| description | TEXT | NULL | Transaction description |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_transactions_userId` - For user's transactions
- `idx_transactions_investmentId` - For investment-related transactions
- `idx_transactions_type` - For filtering by transaction type
- `idx_transactions_status` - For filtering by status
- `idx_transactions_transactionDate` - For date-based queries

## Relationships

### Foreign Key Relationships
1. **users → investments** (1:many)
   - One user can have many investments
   - `investments.userId` → `users.id`

2. **users → transactions** (1:many)
   - One user can have many transactions
   - `transactions.userId` → `users.id`

3. **investments → transactions** (1:many)
   - One investment can have many transactions
   - `transactions.investmentId` → `investments.id`

## Data Types and Constraints

### UUID Primary Keys
All tables use UUID primary keys for better scalability and security.

### Decimal Precision
- **amount**: DECIMAL(12,2) - Supports up to 10 billion with 2 decimal places
- **goldAmount**: DECIMAL(10,4) - Supports up to 1 million with 4 decimal places
- **pricePerGram**: DECIMAL(10,2) - Supports up to 100 million with 2 decimal places

### String Constraints
- **email**: Valid email format validation
- **currency**: Restricted to valid currency codes
- **status**: Enum values for data integrity
- **type**: Enum values for transaction types

### Timestamps
- **createdAt**: Automatically set on record creation
- **updatedAt**: Automatically updated on record modification
- **lastLogin**: Manually updated on user login
- **investmentDate**: Set at investment creation
- **transactionDate**: Set at transaction creation

## Sample Data

The database includes sample data for testing:
- 3 sample users (including admin)
- 4 sample gold prices (different currencies and units)
- 3 sample investments
- 3 sample transactions

## Setup Instructions

### Method 1: Using Node.js Script
```bash
npm run setup-db
```

### Method 2: Using SQL Script
```bash
psql -U postgres -d gold_investment_platform -f scripts/createTables.sql
```

### Method 3: Using Sequelize Sync
```bash
npm run create-tables
```

## Performance Considerations

### Indexes
All foreign keys and frequently queried columns have indexes for optimal performance.

### Triggers
Automatic `updatedAt` timestamp updates using PostgreSQL triggers.

### Constraints
Comprehensive CHECK constraints ensure data integrity at the database level.

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt
2. **Input Validation**: Database-level constraints prevent invalid data
3. **Foreign Key Constraints**: Ensure referential integrity
4. **UUID Primary Keys**: Prevent enumeration attacks
5. **Timestamp Tracking**: Audit trail for all records


