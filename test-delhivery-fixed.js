#!/usr/bin/env node

/**
 * FIXED Delhivery Test - Addressing API Errors
 * Based on the detailed error response we received
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  url: 'https://track.delhivery.com/api/cmu/create.json',
  token: process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN,
  warehouse: 'Main Warehouse'
};

console.log('🚀 FIXED Delhivery Shipment Test');
console.log('📍 API URL:', config.url);
console.log('🔐 Token configured:', config.token ? 'Yes' : 'No');
console.log('🏭 Warehouse:', config.warehouse);

/**
 * ANALYSIS OF PREVIOUS ERROR:
 * ===========================
 * Error: "COD amount missing for COD/Cash package"
 * Issue: cod_amount field was missing for COD payment mode
 * Fix: Always include cod_amount for COD shipments
 */

/**
 * Test FIXED shipment creation
 */
async function testFixedShipment() {
  const orderId = `FIXED_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const payload = {
    shipments: [{
      name: "John Doe",
      add: "123 Main Street, New Delhi, Delhi",
      pin: "110001",
      city: "New Delhi", 
      state: "Delhi",
      country: "India",
      phone: "9876543210",
      order: orderId,
      payment_mode: "COD",
      products_desc: "Test Product - Cotton T-Shirt",
      weight: "500",
      quantity: "1",
      // FIX 1: Added missing COD amount for COD shipments
      cod_amount: "599",
      total_amount: "599",
      // FIX 2: Added shipping mode (required field)
      shipping_mode: "Surface",
      // FIX 3: Added HSN code (good practice)
      hsn_code: "6109",
      // FIX 4: Added seller information
      seller_name: "Test Seller",
      seller_add: "Test Seller Address, Delhi",
      seller_inv: "INV-2025-001"
    }],
    pickup_location: {
      name: config.warehouse
    }
  };

  console.log('\n🔄 Testing FIXED shipment creation...');
  console.log('📦 Order ID:', orderId);
  console.log('💰 COD Amount: ₹599 (FIXED - was missing before)');
  console.log('📄 Complete Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios({
      method: 'POST',
      url: config.url,
      headers: {
        'Authorization': `Token ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `format=json&data=${JSON.stringify(payload)}`,
      timeout: 15000
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('📄 Full Response:', JSON.stringify(response.data, null, 2));

    const data = response.data;
    if (data.success) {
      console.log('\n🎉 SUCCESS! Shipment created successfully!');
      if (data.packages && data.packages.length > 0) {
        data.packages.forEach((pkg, index) => {
          console.log(`📦 Package ${index + 1}:`);
          console.log(`   Waybill: ${pkg.waybill}`);
          console.log(`   Status: ${pkg.status}`);
          console.log(`   Sort Code: ${pkg.sort_code}`);
        });
      }
    } else {
      console.log('\n⚠️  API returned success: false');
      console.log('📝 Error message:', data.error || data.message || 'No specific error');
      console.log('📋 Remarks:', data.rmk || 'No remarks');
      
      if (data.packages && data.packages.length > 0) {
        console.log('\n📦 Package Details:');
        data.packages.forEach((pkg, index) => {
          console.log(`Package ${index + 1}:`);
          console.log(`   Status: ${pkg.status}`);
          console.log(`   Serviceable: ${pkg.serviceable}`);
          console.log(`   Payment: ${pkg.payment}`);
          console.log(`   COD Amount: ${pkg.cod_amount}`);
          if (pkg.remarks && pkg.remarks.length > 0) {
            console.log(`   Remarks: ${pkg.remarks.join(', ')}`);
          }
        });
      }
    }

    return data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('\n⏰ Request timed out after 15 seconds');
    } else if (error.response) {
      console.error('\n❌ HTTP Error:', error.response.status);
      console.error('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\n❌ Network Error: No response received');
    } else {
      console.error('\n❌ Request Setup Error:', error.message);
    }
    return null;
  }
}

/**
 * Test PREPAID shipment (no COD amount needed)
 */
async function testPrepaidShipment() {
  const orderId = `PREPAID_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const payload = {
    shipments: [{
      name: "Jane Smith",
      add: "456 Park Avenue, Sector 15, Gurgaon",
      pin: "122001",
      city: "Gurgaon", 
      state: "Haryana",
      country: "India",
      phone: "9876543212",
      order: orderId,
      payment_mode: "Prepaid", // No COD amount needed for prepaid
      products_desc: "Wireless Headphones - Black",
      weight: "300",
      quantity: "1",
      total_amount: "2499",
      shipping_mode: "Express",
      hsn_code: "8518",
      seller_name: "Electronics Store",
      seller_add: "Tech Park, Electronics City, Gurgaon",
      seller_inv: "INV-2025-002"
    }],
    pickup_location: {
      name: config.warehouse
    }
  };

  console.log('\n🔄 Testing PREPAID shipment creation...');
  console.log('📦 Order ID:', orderId);
  console.log('💳 Payment: Prepaid (no COD amount needed)');

  try {
    const response = await axios({
      method: 'POST',
      url: config.url,
      headers: {
        'Authorization': `Token ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `format=json&data=${JSON.stringify(payload)}`,
      timeout: 15000
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('📄 Full Response:', JSON.stringify(response.data, null, 2));

    const data = response.data;
    if (data.success) {
      console.log('\n🎉 SUCCESS! Prepaid shipment created successfully!');
      if (data.packages && data.packages.length > 0) {
        data.packages.forEach((pkg, index) => {
          console.log(`📦 Package ${index + 1}:`);
          console.log(`   Waybill: ${pkg.waybill}`);
          console.log(`   Status: ${pkg.status}`);
          console.log(`   Sort Code: ${pkg.sort_code}`);
        });
      }
    } else {
      console.log('\n⚠️  Prepaid shipment also failed');
      console.log('📋 Remarks:', data.rmk || 'No remarks');
      
      if (data.packages && data.packages.length > 0) {
        data.packages.forEach((pkg, index) => {
          console.log(`Package ${index + 1} Status: ${pkg.status}`);
          if (pkg.remarks && pkg.remarks.length > 0) {
            console.log(`   Remarks: ${pkg.remarks.join(', ')}`);
          }
        });
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Prepaid shipment error:', error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 Starting FIXED Delhivery Tests...\n');
  
  // Test 1: Fixed COD shipment
  console.log('='.repeat(50));
  console.log('TEST 1: FIXED COD SHIPMENT');
  console.log('='.repeat(50));
  const codResult = await testFixedShipment();
  
  // Add delay between tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Prepaid shipment
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: PREPAID SHIPMENT');
  console.log('='.repeat(50));
  const prepaidResult = await testPrepaidShipment();
  
  console.log('\n📋 FINAL TEST SUMMARY:');
  console.log('======================');
  
  console.log('\n🔍 KEY LEARNINGS FROM PREVIOUS ERROR:');
  console.log('- ✅ API is working and accessible');
  console.log('- ✅ Authentication is successful');
  console.log('- ❌ COD shipments MUST include cod_amount field');
  console.log('- ⚠️  Some packages marked as serviceable: false');
  console.log('- 📝 Error: "COD amount missing for COD/Cash package"');
  
  if (codResult && codResult.success) {
    console.log('\n🎉 COD Test: SUCCESS! Issue was missing cod_amount field');
  } else {
    console.log('\n⚠️  COD Test: Still failing - check warehouse configuration');
  }
  
  if (prepaidResult && prepaidResult.success) {
    console.log('🎉 Prepaid Test: SUCCESS! No COD amount needed');
  } else {
    console.log('⚠️  Prepaid Test: Still failing - warehouse issue likely');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If tests still fail: Warehouse "Main Warehouse" needs registration');
  console.log('2. Check Delhivery dashboard for warehouse setup');
  console.log('3. Verify warehouse is ACTIVE and approved for shipments');
  console.log('4. Contact Delhivery support if warehouse issues persist');
}

// Run the tests
runTests().catch(console.error);
