#!/usr/bin/env node

/**
 * Delhivery API Test with Timeout and Better Error Handling
 */

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

// Load environment variables manually
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env file:', error.message);
    return {};
  }
}

const envVars = loadEnvFile();

// Configuration with staging fallback
const config = {
  token: envVars.DELHIVERY_API_TOKEN || envVars.DELHIVERY_AUTH_TOKEN,
  warehouse: envVars.DELHIVERY_WAREHOUSE_NAME || 'Main Warehouse',
  production: {
    url: 'https://track.delhivery.com/api/cmu/create.json'
  },
  staging: {
    url: 'https://staging-express.delhivery.com/api/cmu/create.json'
  }
};

console.log('🚀 Testing Delhivery Shipment Creation');
console.log('🔐 Token configured:', config.token ? 'Yes' : 'No');
console.log('🏭 Warehouse:', config.warehouse);

if (!config.token) {
  console.error('❌ Delhivery API token not configured!');
  process.exit(1);
}

/**
 * Test API connectivity first
 */
function testAPIConnectivity(apiUrl) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout - API not reachable'));
    }, 10000);

    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    console.log(`\n🔍 Testing connectivity to ${url.hostname}...`);

    const req = https.request(options, (res) => {
      clearTimeout(timeout);
      console.log(`✅ Connected to ${url.hostname} - Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ Connection failed: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      clearTimeout(timeout);
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test shipment creation with timeout
 */
function testShipmentCreation(apiUrl) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout after 15 seconds'));
    }, 15000);

    const orderId = `TEST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const payload = {
      shipments: [{
        name: "John Doe",
        add: "123 Main Street, Block A, New Delhi",
        pin: "110001",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        phone: "9876543210",
        order: orderId,
        payment_mode: "COD",
        products_desc: "Cotton T-Shirt - Blue - Size L",
        hsn_code: "6109",
        cod_amount: "599",
        total_amount: "599",
        weight: "200",
        quantity: "1",
        shipping_mode: "Surface",
        address_type: "home"
      }],
      pickup_location: {
        name: config.warehouse
      }
    };

    const url = new URL(apiUrl);
    const postData = querystring.stringify({
      format: 'json',
      data: JSON.stringify(payload)
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    console.log(`\n📤 Testing shipment creation on ${url.hostname}`);
    console.log(`📦 Order ID: ${orderId}`);

    const req = https.request(options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          console.log(`📄 Response:`, JSON.stringify(response, null, 2));
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          console.error(`❌ JSON Parse Error:`, error.message);
          console.error(`📄 Raw Response:`, data);
          resolve({ status: res.statusCode, data: data, error: 'JSON Parse Error' });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ Request Error:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      clearTimeout(timeout);
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 Starting Delhivery API Tests...\n');
  
  // Test both production and staging
  const environments = [
    { name: 'Production', url: config.production.url },
    { name: 'Staging', url: config.staging.url }
  ];

  for (const env of environments) {
    console.log(`\n🌐 Testing ${env.name} Environment`);
    console.log(`🔗 URL: ${env.url}`);
    
    try {
      // Test connectivity first
      await testAPIConnectivity(env.url);
      
      // Test shipment creation
      const result = await testShipmentCreation(env.url);
      
      if (result.status === 200 && result.data.success) {
        console.log(`🎉 ${env.name} - Success!`);
        if (result.data.packages) {
          console.log(`📦 Waybills: ${result.data.packages.map(p => p.waybill).join(', ')}`);
        }
      } else {
        console.log(`⚠️  ${env.name} - API responded but with issues`);
        if (result.data.error) {
          console.log(`📝 Error: ${result.data.error}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${env.name} - Failed: ${error.message}`);
    }
    
    console.log(`\n${'='.repeat(50)}`);
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n🎯 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  });
