# Payment Gateway Integration

This document outlines the PhonePe payment gateway integration for our Gold Investment Platform.

## Features

- Secure payment processing via PhonePe
- Real-time payment status updates
- Webhook support for payment notifications
- Demo interface for testing

## Setup Instructions

1. **Environment Variables**
   ```env
   # PhonePe Configuration
   PHONEPE_MERCHANT_ID=SU2509181620538430343309
   PHONEPE_API_KEY=c49236d6-2687-4ac3-8514-90060b5fd565
   PHONEPE_CLIENT_VERSION=1
   PHONEPE_ENV=PROD  # or UAT for testing
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

## Demo

1. Access the demo page: http://localhost:3000/demo
2. Enter an amount and click "Pay Now"
3. Complete the payment on the PhonePe page
4. You'll be redirected back to see the payment status

## API Endpoints

- `POST /api/payments/initiate` - Initialize a payment
- `POST /api/payments/callback` - PhonePe callback URL
- `GET /api/payments/status/:transactionId` - Check payment status

## Security Considerations

- All API calls are authenticated using JWT
- Sensitive data is not stored in the database
- Payment callbacks are verified using signatures

## Testing

For testing purposes, you can use the following test credentials:

- **Test Card**: Any Visa/Mastercard
- **CVV**: Any 3-digit number
- **Expiry**: Any future date
- **OTP**: 123456 (for test transactions)

## Support

For any issues, please contact:
- **Email**: support@yourdomain.com
- **Phone**: +91 XXXXXXXXXX

## Screenshots

![Payment Demo](screenshots/payment-demo.png)
