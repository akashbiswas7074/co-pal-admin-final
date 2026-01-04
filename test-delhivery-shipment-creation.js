#!/usr/bin/env node

/**
 * Delhivery Shipment Creation Test Script
 * 
 * This script tests various shipment creation scenarios:
 * 1. Single Package Forward (COD/Prepaid)
 * 2. Reverse Pickup
 * 3. Replacement (REPL)
 * 4. Multi-Package Shipment (MPS)
 * 5. Fragile & Dangerous Goods
 * 
 * Based on official Delhivery API documentation
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const DELHIVERY_CONFIG = {
  // Use staging for testing, production for live
  staging: {
    url: 'https://staging-express.delhivery.com/api/cmu/create.json',
    token: process.env.DELHIVERY_STAGING_TOKEN || process.env.DELHIVERY_AUTH_TOKEN
  },
  production: {
    url: 'https://track.delhivery.com/api/cmu/create.json',
    token: process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN
  }
};

// Test environment - switch between 'staging' and 'production'
const TEST_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'staging';
const config = DELHIVERY_CONFIG[TEST_ENV];

console.log(`🚀 Testing Delhivery Shipment Creation (${TEST_ENV.toUpperCase()})`);
console.log(`📍 API URL: ${config.url}`);
console.log(`🔐 Token configured: ${config.token ? 'Yes' : 'No'}`);

if (!config.token) {
  console.error('❌ Delhivery API token not configured!');
  console.error('Please set DELHIVERY_API_TOKEN or DELHIVERY_AUTH_TOKEN in your .env file');
  process.exit(1);
}

// Test warehouse - replace with your actual warehouse name
const TEST_WAREHOUSE = process.env.DELHIVERY_WAREHOUSE_NAME || 'Main Warehouse';

console.log(`🏭 Using warehouse: ${TEST_WAREHOUSE}`);

/**
 * Generate unique order ID
 */
function generateOrderId(prefix = 'TEST') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Create shipment request
 */
async function createShipment(payload, description) {
  try {
    console.log(`\n🔄 Testing: ${description}`);
    console.log(`📦 Order ID: ${payload.shipments[0].order}`);
    console.log(`🏭 Pickup Location: ${payload.pickup_location.name}`);
    
    const options = {
      method: 'POST',
      url: config.url,
      headers: {
        'Authorization': `Token ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'  // Fixed content type
      },
      data: `format=json&data=${JSON.stringify(payload)}`
    };

    const response = await axios.request(options);
    
    // Enhanced response logging
    const responseData = response.data;
    console.log('📊 Full Response:', JSON.stringify(responseData, null, 2));
    
    console.log('✅ Response Summary:', {
      success: responseData.success,
      packages: responseData.packages?.length || 0,
      waybill: responseData.packages?.[0]?.waybill || 'N/A',
      status: responseData.packages?.[0]?.status || 'N/A',
      error: responseData.error || responseData.message || 'N/A',
      rmk: responseData.rmk || 'N/A'
    });

    return responseData;
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
    return null;
  }
}

/**
 * Test Cases
 */

// Test 0: Minimal Payload Test (for debugging)
async function testMinimalPayload() {
  const payload = {
    shipments: [{
      name: "John Doe",
      add: "123 Main Street, New Delhi",
      pin: "110001",
      phone: "9876543210",
      order: generateOrderId('MINIMAL'),
      payment_mode: "COD"
    }],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await createShipment(payload, "Minimal Payload Test");
}

// Test 1: Single Package Forward Shipment (COD)
async function testForwardCOD() {
  const payload = {
    shipments: [{
      name: "John Doe",
      add: "123 Main Street, Block A",
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
      name: TEST_WAREHOUSE
    }
  };

  return await createShipment(payload, "Forward COD Shipment");
}

// Test 2: Single Package Forward Shipment (Prepaid)
async function testForwardPrepaid() {
  const payload = {
    shipments: [{
      name: "Jane Smith",
      add: "456 Park Avenue, Sector 15",
      pin: "122001",
      city: "Gurgaon",
      state: "Haryana",
      country: "India",
      phone: "9876543212",
      order: generateOrderId('PREPAID'),
      payment_mode: "Prepaid",
      products_desc: "Wireless Headphones - Black",
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

  return await createShipment(payload, "Forward Prepaid Shipment");
}

// Test 3: Reverse Pickup Shipment
async function testReversePickup() {
  const payload = {
    shipments: [{
      name: "Alice Johnson",
      add: "789 River Road, Apartment 5B",
      pin: "560001",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      phone: "9876543213",
      order: generateOrderId('PICKUP'),
      payment_mode: "Pickup",
      products_desc: "Returned Item - Defective Product",
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

  return await createShipment(payload, "Reverse Pickup Shipment");
}

// Test 4: Replacement Shipment (REPL)
async function testReplacement() {
  const payload = {
    shipments: [{
      name: "Bob Wilson",
      add: "321 Commerce Street, Floor 2",
      pin: "400050",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      phone: "9876543215",
      order: generateOrderId('REPL'),
      payment_mode: "REPL",
      products_desc: "Replacement Mobile Phone - Same Model",
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

  return await createShipment(payload, "Replacement (REPL) Shipment");
}

// Test 5: Multi-Package Shipment (MPS)
async function testMultiPackage() {
  const masterOrderId = generateOrderId('MPS');
  const masterWaybill = `MPS${Date.now()}001`;
  const childWaybill = `MPS${Date.now()}002`;
  
  const payload = {
    shipments: [
      {
        name: "Charlie Brown",
        add: "654 Garden Lane, Villa 12",
        pin: "600001",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        phone: "9876543217",
        order: masterOrderId,
        payment_mode: "COD",
        products_desc: "Package 1: Books and Stationery",
        hsn_code: "4901",
        cod_amount: "800",
        total_amount: "800",
        weight: "500",
        quantity: "5",
        shipping_mode: "Surface",
        address_type: "home",
        waybill: masterWaybill,
        shipment_width: "30",
        shipment_height: "25",
        shipment_length: "40",
        shipment_type: "MPS",
        master_id: masterWaybill,
        mps_amount: 1500,
        mps_children: 2
      },
      {
        name: "Charlie Brown",
        add: "654 Garden Lane, Villa 12",
        pin: "600001",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        phone: "9876543217",
        order: masterOrderId,
        payment_mode: "COD",
        products_desc: "Package 2: Electronics Accessories",
        hsn_code: "8544",
        cod_amount: "700",
        total_amount: "700",
        weight: "300",
        quantity: "3",
        shipping_mode: "Surface",
        address_type: "home",
        waybill: childWaybill,
        shipment_width: "25",
        shipment_height: "20",
        shipment_length: "30",
        shipment_type: "MPS",
        master_id: masterWaybill,
        mps_amount: 1500,
        mps_children: 2
      }
    ],
    pickup_location: {
      name: TEST_WAREHOUSE
    }
  };

  return await createShipment(payload, "Multi-Package Shipment (MPS)");
}

// Test 6: Fragile and Dangerous Goods
async function testSpecialHandling() {
  const payload = {
    shipments: [{
      name: "Diana Prince",
      add: "987 Industrial Boulevard, Unit 3",
      pin: "500001",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      phone: "9876543218",
      order: generateOrderId('FRAGILE'),
      payment_mode: "Prepaid",
      products_desc: "Fragile Glass Items - Handle with Care",
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

  return await createShipment(payload, "Fragile Items Shipment");
}

// Test 7: High-Value E-waybill Required
async function testHighValueEwaybill() {
  const payload = {
    shipments: [{
      name: "Edward King",
      add: "147 Luxury Apartments, Penthouse Floor",
      pin: "700001",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
      phone: "9876543220",
      order: generateOrderId('EWAYBILL'),
      payment_mode: "Prepaid",
      products_desc: "High-Value Electronics - Laptop",
      hsn_code: "8471",
      ewb: "E-WAY-2025-001",
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

  return await createShipment(payload, "High-Value E-waybill Shipment");
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🧪 Starting Delhivery Shipment Creation Tests...\n');
  
  const tests = [
    { name: 'Minimal Payload', fn: testMinimalPayload },
    { name: 'Forward COD', fn: testForwardCOD },
    { name: 'Forward Prepaid', fn: testForwardPrepaid },
    { name: 'Reverse Pickup', fn: testReversePickup },
    { name: 'Replacement (REPL)', fn: testReplacement },
    { name: 'Multi-Package (MPS)', fn: testMultiPackage },
    { name: 'Fragile Handling', fn: testSpecialHandling },
    { name: 'High-Value E-waybill', fn: testHighValueEwaybill }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({
        test: test.name,
        success: !!result,
        waybill: result?.packages?.[0]?.waybill || 'N/A',
        status: result?.packages?.[0]?.status || 'Failed'
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
    'minimal': testMinimalPayload,
    'cod': testForwardCOD,
    'prepaid': testForwardPrepaid,
    'pickup': testReversePickup,
    'repl': testReplacement,
    'mps': testMultiPackage,
    'fragile': testSpecialHandling,
    'ewaybill': testHighValueEwaybill
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
