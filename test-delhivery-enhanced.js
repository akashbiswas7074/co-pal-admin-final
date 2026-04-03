#!/usr/bin/env node

/**
 * Enhanced Delhivery Test with Better Error Handling
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

console.log('🚀 Enhanced Delhivery Shipment Test');
console.log('📍 API URL:', config.url);
console.log('🔐 Token configured:', config.token ? 'Yes' : 'No');
console.log('🏭 Warehouse:', config.warehouse);

if (!config.token) {
  console.error('❌ Token not configured!');
  process.exit(1);
}

/**
 * Test minimal shipment creation with timeout
 */
async function testMinimalShipment() {
  const orderId = `TEST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
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
      products_desc: "Test Product",
      weight: "500",
      quantity: "1"
    }],
    pickup_location: {
      name: config.warehouse
    }
  };

  console.log('\n🔄 Testing minimal shipment creation...');
  console.log('📦 Order ID:', orderId);
  console.log('📄 Payload:', JSON.stringify(payload, null, 2));

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
      timeout: 15000 // 15 second timeout
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('📄 Full Response:', JSON.stringify(response.data, null, 2));

    const data = response.data;
    if (data.success) {
      console.log('\n🎉 SUCCESS! Shipment created successfully!');
      if (data.packages && data.packages.length > 0) {
        console.log('📦 Waybills:', data.packages.map(p => p.waybill));
      }
    } else {
      console.log('\n⚠️  API returned success: false');
      console.log('📝 Error message:', data.error || data.message || 'No specific error');
      console.log('📋 Remarks:', data.rmk || 'No remarks');
      
      // Check for specific error patterns
      if (data.packages && data.packages.length === 0) {
        console.log('\n🔍 Diagnosis: Empty packages array suggests:');
        console.log('   1. Warehouse name might not be registered');
        console.log('   2. API token might not have shipment creation permissions');
        console.log('   3. Required fields might be missing');
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
      console.error('🔍 Check internet connection and API availability');
    } else {
      console.error('\n❌ Request Setup Error:', error.message);
    }
    return null;
  }
}

/**
 * Test API connectivity first
 */
async function testConnectivity() {
  console.log('\n🔍 Testing API connectivity...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://track.delhivery.com/',
      timeout: 5000
    });
    
    console.log('✅ Delhivery server is reachable');
    return true;
  } catch (error) {
    console.error('❌ Cannot reach Delhivery server:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('\n🧪 Starting Enhanced Delhivery Test...\n');
  
  // Test connectivity first
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.log('🛑 Aborting test due to connectivity issues');
    return;
  }
  
  // Test shipment creation
  const result = await testMinimalShipment();
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  if (result) {
    if (result.success) {
      console.log('✅ Test PASSED - Shipment created successfully!');
    } else {
      console.log('⚠️  Test PARTIAL - API responded but shipment failed');
      console.log('🔧 Action required: Check warehouse registration and API permissions');
    }
  } else {
    console.log('❌ Test FAILED - No response from API');
    console.log('🔧 Action required: Check network connectivity and API configuration');
  }
}

// Run the test
runTest().catch(console.error);
