const crypto = require('crypto');
const axios = require('axios');

class PhonePeService {
  constructor() {
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    this.apiKey = process.env.PHONEPE_API_KEY;
    this.clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
    
    // Set API endpoints based on environment
    this.isProduction = process.env.PHONEPE_ENV === 'PROD';
    this.apiUrl = this.isProduction 
      ? 'https://api.phonepe.com/apis/hermes'  // Production URL
      : 'https://api-preprod.phonepe.com/apis/hermes';  // UAT URL
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.merchantId || !this.apiKey) {
      throw new Error('PhonePe configuration missing. Please set PHONEPE_MERCHANT_ID and PHONEPE_API_KEY');
    }
  }

  /**
   * Generate SHA256 hash
   */
  generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create payment request payload
   */
  createPaymentPayload(amount, orderId, userId, mobile, callbackUrl) {
    const payload = {
      merchantId: this.merchantId,
      merchantTransactionId: orderId,
      merchantUserId: userId,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${callbackUrl}/success?orderId=${orderId}`,
      redirectMode: 'POST',
      callbackUrl: `${callbackUrl}/webhook`,
      mobileNumber: mobile,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    return payload;
  }

  /**
   * Initiate payment
   */
  async initiatePayment(amount, orderId, userId, mobile = null) {
    try {
      const callbackUrl = `${process.env.BASE_URL}/api/payments/phonepe`;
      const payload = this.createPaymentPayload(amount, orderId, userId, mobile, callbackUrl);
      
      // Convert payload to base64
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Generate checksum
      const checksum = this.generateHash(base64Payload + '/pg/v1/pay' + this.apiKey) + '###' + this.clientVersion;
      
      // Make API request
      const response = await axios.post(
        `${this.apiUrl}/pg/v1/pay`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'accept': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: {
            paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
            transactionId: orderId,
            merchantTransactionId: response.data.data.merchantTransactionId
          }
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('PhonePe payment initiation error:', error.response?.data || error.message);
      throw new Error(`Payment initiation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId) {
    try {
      const endpoint = `/pg/v1/status/${this.merchantId}/${transactionId}`;
      const checksum = this.generateHash(endpoint + this.apiKey) + '###' + this.clientVersion;
      
      const response = await axios.get(
        `${this.apiUrl}${endpoint}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': this.merchantId,
            'accept': 'application/json'
          }
        }
      );

      return {
        success: response.data.success,
        code: response.data.code,
        data: response.data.data || null,
        message: response.data.message
      };
    } catch (error) {
      console.error('PhonePe status check error:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate webhook callback
   */
  validateWebhookSignature(body, xVerifyHeader) {
    try {
      if (!xVerifyHeader) {
        return false;
      }

      const parts = xVerifyHeader.split('###');
      const receivedChecksum = parts[0];
      
      // Reconstruct the string to hash
      const response = body.response;
      const salt = this.apiKey;
      const saltIndex = this.clientVersion;
      
      const stringToHash = response + salt;
      const calculatedChecksum = this.generateHash(stringToHash);
      
      return calculatedChecksum === receivedChecksum;
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  /**
   * Process refund
   */
  async initiateRefund(originalTransactionId, refundAmount, refundTransactionId) {
    try {
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: refundTransactionId,
        originalTransactionId: originalTransactionId,
        amount: Math.round(refundAmount * 100), // Convert to paise
        callbackUrl: `${process.env.BASE_URL}/api/payments/phonepe/refund/webhook`
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const endpoint = '/pg/v1/refund';
      const checksum = this.generateHash(base64Payload + endpoint + this.apiKey) + '###' + this.clientVersion;

      const response = await axios.post(
        `${this.apiUrl}${endpoint}`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'accept': 'application/json'
          }
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('PhonePe refund error:', error.response?.data || error.message);
      throw new Error(`Refund failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new PhonePeService();
