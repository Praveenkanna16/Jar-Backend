# Gold Investment Platform - Production Ready

Production-ready backend service for gold investment platform with PhonePe payment gateway integration.

## Features

- **PhonePe Payment Gateway Integration** (Production Ready)
- User authentication with JWT
- PostgreSQL database with Sequelize ORM
- Gold investment management
- Transaction tracking and history
- Refund processing
- Secure API endpoints

## Database Schema

### Tables

1. **users** - User accounts
   - id (UUID, Primary Key)
   - name (String)
   - email (String, Unique)
   - password (String, Hashed)
   - isActive (Boolean)
   - lastLogin (DateTime)
   - createdAt, updatedAt (Timestamps)

2. **gold_prices** - Gold price data
   - id (UUID, Primary Key)
   - price (Decimal)
   - currency (String)
   - unit (String)
   - source (String)
   - isActive (Boolean)
   - createdAt, updatedAt (Timestamps)

3. **investments** - User investments
   - id (UUID, Primary Key)
   - userId (UUID, Foreign Key)
   - amount (Decimal)
   - goldAmount (Decimal)
   - pricePerGram (Decimal)
   - currency (String)
   - status (Enum: pending, completed, cancelled)
   - investmentDate (DateTime)
   - notes (Text)
   - createdAt, updatedAt (Timestamps)

4. **transactions** - Transaction history
   - id (UUID, Primary Key)
   - userId (UUID, Foreign Key)
   - investmentId (UUID, Foreign Key, Optional)
   - type (Enum: buy, sell, deposit, withdrawal)
   - amount (Decimal)
   - goldAmount (Decimal)
   - pricePerGram (Decimal)
   - currency (String)
   - status (Enum: pending, completed, failed, cancelled)
   - transactionDate (DateTime)
   - reference (String)
   - description (Text)
   - createdAt, updatedAt (Timestamps)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Gold-Investment-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb gold_investment_platform

# Or using psql
psql -U postgres
CREATE DATABASE gold_investment_platform;
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update `.env` file with your database credentials:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gold_investment_platform
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_here
```

6. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Request/Response Examples

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Registration successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid_here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid_here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Database Relationships

- Users have many Investments
- Users have many Transactions
- Investments have many Transactions
- All relationships are properly defined with foreign keys

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation
- SQL injection protection through Sequelize ORM
- CORS enabled

## Development

The server will automatically create database tables on startup when using `sequelize.sync({ alter: true })`. This is suitable for development but should be replaced with proper migrations for production.

## Production Setup

### 1. Environment Configuration

```bash
# Copy production environment file
cp .env.production .env

# Update the following in .env:
- FRONTEND_URL: Your frontend domain
- BACKEND_URL/BASE_URL: Your backend domain
- Database credentials
- JWT_SECRET: Generate a secure random string
```

### 2. PhonePe Configuration

Your PhonePe production credentials are already configured:
- **Client ID**: SU2509181620538430343309
- **Secret Key**: c49236d6-2687-4ac3-8514-90060b5fd565
- **Client Version**: 1

### 3. Database Setup

```bash
# Initialize production database
NODE_ENV=production npm run init-db
```

### 4. Start Production Server

```bash
# Using PM2 (recommended)
pm2 start index.js --name gold-investment-api

# Or using Node
NODE_ENV=production node index.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/status/:transactionId` - Check payment status
- `GET /api/payments/transactions` - Get user transactions
- `POST /api/payments/refund` - Initiate refund

### PhonePe Callbacks
- `POST /api/payments/phonepe/webhook` - Webhook callback
- `POST /api/payments/phonepe/success` - Success callback

## Project Structure

```
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   └── paymentController.js  # Payment processing
├── middleware/
│   └── authMiddleware.js     # JWT verification
├── models/
│   ├── User.js              # User model
│   ├── Transaction.js       # Transaction model
│   ├── Investment.js        # Investment model
│   └── GoldPrice.js         # Gold price model
├── routes/
│   ├── auth.js              # Auth routes
│   └── payment.js           # Payment routes
├── services/
│   └── phonepe.service.js   # PhonePe integration
├── scripts/
│   └── init-database.js     # Database initialization
├── .env.production          # Production environment
├── package.json            
└── index.js                 # Main application
```

## Security Considerations

1. **Environment Variables**: Never commit .env files
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure appropriate CORS origins
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs
6. **Error Handling**: Don't expose sensitive error details

## Deployment Checklist

- [ ] Update environment variables
- [ ] Configure database connection
- [ ] Set NODE_ENV=production
- [ ] Setup SSL certificates
- [ ] Configure reverse proxy (nginx/apache)
- [ ] Setup process manager (PM2)
- [ ] Configure logging
- [ ] Setup monitoring
- [ ] Test payment flow in production

## Support

For PhonePe integration support, refer to:
- [PhonePe Developer Documentation](https://developer.phonepe.com/)
- [API Reference](https://developer.phonepe.com/v1/reference)

