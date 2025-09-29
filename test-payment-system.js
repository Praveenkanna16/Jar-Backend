#!/usr/bin/env node
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:5000';
let authToken = null;
let userId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function registerUser() {
  try {
    log('\n📝 Registering new test user...', 'cyan');
    const timestamp = Date.now();
    const userData = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'Test@123',
      phone: '9876543210'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    
    if (response.data.success) {
      log('✅ User registered successfully!', 'green');
      log(`Email: ${userData.email}`, 'yellow');
      log(`Password: ${userData.password}`, 'yellow');
      return userData;
    }
  } catch (error) {
    log(`❌ Registration failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function loginUser(email, password) {
  try {
    log('\n🔐 Logging in...', 'cyan');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      authToken = response.data.token;
      userId = response.data.user.id;
      log('✅ Login successful!', 'green');
      log(`Token: ${authToken.substring(0, 20)}...`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function initiatePayment(amount) {
  try {
    log(`\n💳 Initiating payment for ₹${amount}...`, 'cyan');
    
    const response = await axios.post(
      `${BASE_URL}/api/payments/initiate`,
      {
        amount: parseFloat(amount),
        type: 'buy',
        goldQuantity: parseFloat(amount) / 6500 // Assuming ₹6500 per gram
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      log('✅ Payment initiated successfully!', 'green');
      log(`Transaction ID: ${response.data.data.transactionId}`, 'yellow');
      log(`Payment URL: ${response.data.data.paymentUrl}`, 'blue');
      log('\n📱 Open the above URL in your browser to complete the payment', 'cyan');
      return response.data.data;
    }
  } catch (error) {
    log(`❌ Payment initiation failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function checkPaymentStatus(transactionId) {
  try {
    log(`\n🔍 Checking payment status for ${transactionId}...`, 'cyan');
    
    const response = await axios.get(
      `${BASE_URL}/api/payments/status/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      const status = response.data.data.status;
      const statusColor = status === 'completed' ? 'green' : 
                         status === 'pending' ? 'yellow' : 'red';
      
      log(`Payment Status: ${status.toUpperCase()}`, statusColor);
      log(`Amount: ₹${response.data.data.amount}`, 'yellow');
      return response.data.data;
    }
  } catch (error) {
    log(`❌ Status check failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function getTransactions() {
  try {
    log('\n📋 Fetching your transactions...', 'cyan');
    
    const response = await axios.get(
      `${BASE_URL}/api/payments/transactions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      const transactions = response.data.data.transactions;
      if (transactions.length === 0) {
        log('No transactions found', 'yellow');
      } else {
        log(`\nFound ${transactions.length} transaction(s):`, 'green');
        transactions.forEach((tx, index) => {
          log(`\n${index + 1}. Transaction ID: ${tx.transactionId}`, 'blue');
          log(`   Amount: ₹${tx.amount}`, 'yellow');
          log(`   Status: ${tx.status}`, tx.status === 'completed' ? 'green' : 'yellow');
          log(`   Date: ${new Date(tx.createdAt || tx.createdat).toLocaleString()}`, 'cyan');
        });
      }
      return transactions;
    }
  } catch (error) {
    log(`❌ Failed to fetch transactions: ${error.response?.data?.message || error.message}`, 'red');
    return [];
  }
}

async function testServerConnection() {
  try {
    log('🔌 Testing server connection...', 'cyan');
    const response = await axios.get(BASE_URL);
    if (response.data.status === 'OK') {
      log('✅ Server is running!', 'green');
      log(`Environment: ${response.data.environment}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Server is not responding at ${BASE_URL}`, 'red');
    log('Please start the server with: npm start', 'yellow');
    return false;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function interactiveMenu() {
  while (true) {
    log('\n========== PAYMENT SYSTEM TEST MENU ==========', 'blue');
    log('1. Register & Login', 'cyan');
    log('2. Initiate Payment', 'cyan');
    log('3. Check Payment Status', 'cyan');
    log('4. View All Transactions', 'cyan');
    log('5. Test Full Payment Flow (Auto)', 'cyan');
    log('6. Exit', 'cyan');
    log('===============================================', 'blue');

    const choice = await askQuestion('\nSelect option (1-6): ');

    switch(choice) {
      case '1':
        const user = await registerUser();
        if (user) {
          await loginUser(user.email, user.password);
        }
        break;

      case '2':
        if (!authToken) {
          log('Please login first (Option 1)', 'yellow');
          break;
        }
        const amount = await askQuestion('Enter amount in INR: ');
        const paymentData = await initiatePayment(amount);
        if (paymentData) {
          const openBrowser = await askQuestion('Open payment URL in browser? (y/n): ');
          if (openBrowser.toLowerCase() === 'y') {
            require('child_process').exec(`open "${paymentData.paymentUrl}"`);
          }
        }
        break;

      case '3':
        if (!authToken) {
          log('Please login first (Option 1)', 'yellow');
          break;
        }
        const txId = await askQuestion('Enter Transaction ID: ');
        await checkPaymentStatus(txId);
        break;

      case '4':
        if (!authToken) {
          log('Please login first (Option 1)', 'yellow');
          break;
        }
        await getTransactions();
        break;

      case '5':
        await runFullTest();
        break;

      case '6':
        log('👋 Goodbye!', 'green');
        rl.close();
        process.exit(0);

      default:
        log('Invalid option. Please try again.', 'red');
    }
  }
}

async function runFullTest() {
  log('\n🚀 Starting Full Payment System Test...', 'blue');
  log('=====================================', 'blue');

  // Test 1: Register & Login
  const user = await registerUser();
  if (!user) {
    log('Test failed at registration', 'red');
    return;
  }

  const loginSuccess = await loginUser(user.email, user.password);
  if (!loginSuccess) {
    log('Test failed at login', 'red');
    return;
  }

  // Test 2: Initiate Payment
  const paymentData = await initiatePayment(100);
  if (!paymentData) {
    log('Test failed at payment initiation', 'red');
    return;
  }

  // Test 3: Check Status
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  await checkPaymentStatus(paymentData.transactionId);

  // Test 4: Get Transactions
  await getTransactions();

  log('\n=====================================', 'blue');
  log('✅ Full test completed successfully!', 'green');
  log('=====================================', 'blue');
}

async function main() {
  log('\n🏦 Gold Investment Platform - Payment System Tester', 'blue');
  log('==================================================', 'blue');

  // Check server connection
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    rl.close();
    process.exit(1);
  }

  // Start interactive menu
  await interactiveMenu();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

// Start the test
main();
