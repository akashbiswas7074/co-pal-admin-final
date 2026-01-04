/**
 * Simple Delhivery Shipment Creation Test
 * 
 * This script tests basic shipment creation scenarios using Node.js built-in modules
 * Can be run directly with: node test-delhivery-simple.js
 */

const https = require('https');
const querystring = require('querystring');

// Configuration
const DELHIVERY_CONFIG = {
  staging: {
    url: 'https://staging-express.delhivery.com/api/cmu/create.json',
    token: process.env.DELHIVERY_STAGING_TOKEN || process.env.DELHIVERY_AUTH_TOKEN
  },
  production: {
    url: 'https://track.delhivery.com/api/cmu/create.json', 
    token: process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN
  }
};

// Test environment
const TEST_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'staging';
const config = DELHIVERY_CONFIG[TEST_ENV];

console.log(`🚀 Testing Delhivery Shipment Creation (${TEST_ENV.toUpperCase()})`);
console.log(`📍 API URL: ${config.url}`);
console.log(`🔐 Token configured: ${config.token ? 'Yes' : 'No'}`);

if (!config.token) {
  console.error('❌ Delhivery API token not configured!');
  console.error('Please set DELHIVERY_API_TOKEN or DELHIVERY_AUTH_TOKEN in your environment');
  process.exit(1);
}

// Test warehouse
const TEST_WAREHOUSE = process.env.DELHIVERY_WAREHOUSE_NAME || 'TestWarehouse';

/**
 * Generate unique order ID
 */
function generateOrderId(prefix = 'TEST') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Make HTTP request to Delhivery API
 */
function makeRequest(payload, description) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.url);
    
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
      }
    };

    console.log(`\n🔄 Testing: ${description}`);
    console.log(`📦 Order ID: ${payload.shipments[0].order}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Success Response:', {
              success: response.success,
              packages: response.packages ? response.packages.length : 'N/A',
              waybill: response.packages?.[0]?.waybill || 'N/A',
              status: response.packages?.[0]?.status || 'N/A'
            });
            resolve(response);
          } else {
            console.error('❌ HTTP Error:', res.statusCode, response);
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          console.error('❌ Parse Error:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test 1: Forward COD Shipment
 */
async function testForwardCOD() {
  const payload = {
    shipments: [{
      name: "John Doe",
      add: "123 Main Street, Block A, Near City Mall",
      pin: "110001",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      phone: "9876543210",
      order: generateOrderId('COD'),
      payment_mode: "COD",
      products_desc: "Cotton T-Shirt - Blue - Size L",
      hsn_code: "6109",
      cod_amount: "599",
      total_amount: "599",
      weight: "200",
      quantity: "1",
      shipping_mode: "Surface",
      address_type: "home",
      seller_name: "Test Seller",
      seller_add: "Seller Address, Business District",
      seller_inv: "INV-2025-001",
      shipment_width: "25",
      shipment_height: "30",
      shipment_length: "35",
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false,
      return_name: "Return Center",
      return_add: "Return Address, Warehouse District",
      return_city: "Mumbai",
      return_state: "Maharashtra",
      return_country: "India",
      return_pin: "400001",
      return_phone: "9876543211"
    }],
    pickup_location: {
      name: "Main Warehouse"
    }
  };

  return await makeRequest(payload, "Forward COD Shipment");
}

/**
 * Test 2: Forward Prepaid Shipment
 */
async function testForwardPrepaid() {
  const payload = {
    shipments: [{
      name: "Jane Smith",
      add: "456 Park Avenue, Sector 15, Near Metro Station",
      pin: "122001",
      city: "Gurgaon",
      state: "Haryana",
      country: "India",
      phone: "9876543212",
      order: generateOrderId('PREPAID'),
      payment_mode: "Prepaid",
      products_desc: "Wireless Headphones - Black - Premium Quality",
      hsn_code: "8518",
      total_amount: "2499",
      weight: "300",
      quantity: "1",
      shipping_mode: "Express",
      address_type: "office",
      seller_name: "Electronics Store",
      seller_add: "Tech Park, Electronics City",
      seller_inv: "INV-2025-002",
      shipment_width: "20",
      shipment_height: "15",
      shipment_length: "25",
      fragile_shipment: true,
      dangerous_good: false,
      plastic_packaging: true
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await makeRequest(payload, "Forward Prepaid Shipment");
}

/**
 * Test 3: Reverse Pickup Shipment
 */
async function testReversePickup() {
  const payload = {
    shipments: [{
      name: "Alice Johnson",
      add: "789 River Road, Apartment 5B, Tower C",
      pin: "560001",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      phone: "9876543213",
      order: generateOrderId('PICKUP'),
      payment_mode: "Pickup",
      products_desc: "Returned Item - Defective Product - Customer Return",
      total_amount: "1299",
      weight: "150",
      quantity: "1",
      shipping_mode: "Surface",
      address_type: "home",
      return_name: "Warehouse Manager",
      return_add: "Return Processing Center, Industrial Area",
      return_city: "Delhi",
      return_state: "Delhi",
      return_country: "India",
      return_pin: "110020",
      return_phone: "9876543214"
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await makeRequest(payload, "Reverse Pickup Shipment");
}

/**
 * Test 4: Replacement Shipment (REPL)
 */
async function testReplacement() {
  const payload = {
    shipments: [{
      name: "Bob Wilson",
      add: "321 Commerce Street, Floor 2, Office 201",
      pin: "400050",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      phone: "9876543215",
      order: generateOrderId('REPL'),
      payment_mode: "REPL",
      products_desc: "Replacement Mobile Phone - Same Model - Exchange",
      hsn_code: "8517",
      total_amount: "15999",
      weight: "250",
      quantity: "1",
      shipping_mode: "Express",
      address_type: "office",
      seller_name: "Mobile Store",
      seller_add: "Mobile Market, Electronics Hub",
      seller_inv: "INV-2025-003",
      shipment_width: "15",
      shipment_height: "20",
      shipment_length: "8",
      fragile_shipment: true,
      dangerous_good: false,
      return_name: "Exchange Center",
      return_add: "Final Delivery Address, Residential Area",
      return_city: "Pune",
      return_state: "Maharashtra",
      return_country: "India",
      return_pin: "411001",
      return_phone: "9876543216"
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await makeRequest(payload, "Replacement (REPL) Shipment");
}

/**
 * Test 5: Fragile Items Shipment
 */
async function testFragileItems() {
  const payload = {
    shipments: [{
      name: "Diana Prince",
      add: "987 Industrial Boulevard, Unit 3, Warehouse Complex",
      pin: "500001",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      phone: "9876543218",
      order: generateOrderId('FRAGILE'),
      payment_mode: "Prepaid",
      products_desc: "Fragile Glass Items - Handle with Care - Decorative Vases",
      hsn_code: "7013",
      total_amount: "3999",
      weight: "800",
      quantity: "2",
      shipping_mode: "Express",
      address_type: "office",
      seller_name: "Glassware Company",
      seller_add: "Glass Factory, Industrial Zone",
      seller_inv: "INV-2025-004",
      shipment_width: "40",
      shipment_height: "30",
      shipment_length: "50",
      fragile_shipment: true,
      dangerous_good: false,
      plastic_packaging: true,
      return_name: "Fragile Returns",
      return_add: "Specialized Handling Center",
      return_city: "Chennai",
      return_state: "Tamil Nadu",
      return_country: "India",
      return_pin: "600020",
      return_phone: "9876543219"
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await makeRequest(payload, "Fragile Items Shipment");
}

/**
 * Test 6: High-Value Shipment with E-waybill
 */
async function testHighValueShipment() {
  const payload = {
    shipments: [{
      name: "Edward King",
      add: "147 Luxury Apartments, Penthouse Floor, Tower A",
      pin: "700001",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
      phone: "9876543220",
      order: generateOrderId('EWAYBILL'),
      payment_mode: "Prepaid",
      products_desc: "High-Value Electronics - Premium Laptop - Gaming Edition",
      hsn_code: "8471",
      ewb: "12345678901234",
      total_amount: "75000",
      weight: "2000",
      quantity: "1",
      shipping_mode: "Express",
      address_type: "home",
      seller_name: "Premium Electronics",
      seller_add: "Tech Mall, Electronics District",
      seller_inv: "INV-2025-005",
      shipment_width: "45",
      shipment_height: "35",
      shipment_length: "60",
      fragile_shipment: true,
      dangerous_good: false,
      plastic_packaging: true
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await makeRequest(payload, "High-Value E-waybill Shipment");
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🧪 Starting Delhivery Shipment Creation Tests...\n');
  
  const tests = [
    { name: 'Forward COD', fn: testForwardCOD },
    { name: 'Forward Prepaid', fn: testForwardPrepaid },
    { name: 'Reverse Pickup', fn: testReversePickup },
    { name: 'Replacement (REPL)', fn: testReplacement },
    { name: 'Fragile Items', fn: testFragileItems },
    { name: 'High-Value E-waybill', fn: testHighValueShipment }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({
        test: test.name,
        success: !!result,
        waybill: result?.packages?.[0]?.waybill || 'N/A',
        status: result?.packages?.[0]?.status || 'Unknown'
      });
    } catch (error) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    if (result.success && result.waybill !== 'N/A') {
      console.log(`   📦 Waybill: ${result.waybill}`);
      console.log(`   📋 Status: ${result.status}`);
    }
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n📈 Overall Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Delhivery integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration and error messages.');
  }
}

/**
 * Individual test runner
 */
async function runSpecificTest(testName) {
  const testMap = {
    'cod': testForwardCOD,
    'prepaid': testForwardPrepaid,
    'pickup': testReversePickup,
    'repl': testReplacement,
    'fragile': testFragileItems,
    'ewaybill': testHighValueShipment
  };

  if (testName && testMap[testName]) {
    console.log(`\n🎯 Running specific test: ${testName}`);
    await testMap[testName]();
  } else {
    console.log('\n📋 Available tests:');
    Object.keys(testMap).forEach(key => {
      console.log(`  - ${key}`);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific test
    await runSpecificTest(args[0]);
  } else {
    // Run all tests
    await runAllTests();
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);
