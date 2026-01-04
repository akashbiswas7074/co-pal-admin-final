#!/usr/bin/env node

/**
 * Delhivery API Diagnostic Script
 * Helps identify issues with Delhivery API integration
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function diagnoseDelhiveryAPI() {
  console.log('🔍 Delhivery API Diagnostic Tool');
  console.log('================================');
  
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  const baseUrl = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';
  
  console.log('📋 Configuration:');
  console.log('- Base URL:', baseUrl);
  console.log('- Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'NOT SET');
  console.log('- Environment:', baseUrl.includes('staging') ? 'STAGING' : 'PRODUCTION');
  
  if (!token) {
    console.error('❌ DELHIVERY_AUTH_TOKEN not set');
    return;
  }

  // Test 1: Check token validity
  console.log('\n🔑 Test 1: Token Validation');
  await testTokenValidity(token, baseUrl);

  // Test 2: Test waybill generation
  console.log('\n📦 Test 2: Waybill Generation');
  await testWaybillGeneration(token, baseUrl);

  // Test 3: Test warehouse endpoints
  console.log('\n🏢 Test 3: Warehouse Endpoints');
  await testWarehouseEndpoints(token, baseUrl);

  // Test 4: Test shipment creation with minimal payload
  console.log('\n🚢 Test 4: Minimal Shipment Creation');
  await testMinimalShipmentCreation(token, baseUrl);

  // Test 5: Check API documentation compliance
  console.log('\n📚 Test 5: API Documentation Compliance');
  await testAPICompliance(token, baseUrl);

  console.log('\n✅ Diagnostic complete!');
}

async function testTokenValidity(token, baseUrl) {
  try {
    // Try a simple API call to check if token is valid
    const response = await fetch(`${baseUrl}/api/v1/packages/json/?waybill=test`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      }
    });

    console.log('📊 Token test response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ Token is invalid or expired');
    } else if (response.status === 403) {
      console.log('❌ Token is valid but lacks permissions');
    } else {
      console.log('✅ Token appears to be valid');
    }

    const responseText = await response.text();
    console.log('📝 Response sample:', responseText.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Token validation error:', error.message);
  }
}

async function testWaybillGeneration(token, baseUrl) {
  try {
    // Test single waybill generation
    const isProduction = baseUrl.includes('track.delhivery.com');
    const waybillUrl = isProduction 
      ? 'https://track.delhivery.com/waybill/api/fetch/json/'
      : 'https://staging-express.delhivery.com/waybill/api/fetch/json/';
    
    const response = await fetch(`${waybillUrl}?token=${token}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('📊 Waybill generation status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Waybill generated successfully:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Waybill generation failed:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Waybill generation error:', error.message);
  }
}

async function testWarehouseEndpoints(token, baseUrl) {
  const warehouseEndpoints = [
    '/api/backend/clientwarehouse/',
    '/api/backend/warehouse/',
    '/api/cmu/warehouse/',
    '/api/warehouse/',
    '/api/v1/warehouse/',
    '/api/pickup/warehouse/',
    '/api/pickup/location/',
    '/api/pickup/locations/'
  ];

  for (const endpoint of warehouseEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        }
      });

      console.log(`📊 ${endpoint} - Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${endpoint} - Success:`, Object.keys(result));
        break; // Found a working endpoint
      } else if (response.status !== 404) {
        const errorText = await response.text();
        console.log(`❌ ${endpoint} - Error:`, errorText.substring(0, 100));
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Exception:`, error.message);
    }
  }
}

async function testMinimalShipmentCreation(token, baseUrl) {
  try {
    // Create a minimal test shipment
    const testPayload = {
      shipments: [
        {
          name: "Test Customer",
          add: "Test Address",
          pin: "400001",
          phone: "9999999999",
          order: "TEST_" + Date.now(),
          payment_mode: "Prepaid",
          return_pin: "400001",
          return_phone: "9999999999",
          return_add: "Return Address",
          return_name: "Return Center",
          products_desc: "Test Product",
          cod_amount: "0",
          total_amount: "100",
          weight: "500"
        }
      ],
      pickup_location: {
        name: "Test Warehouse"
      }
    };

    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify(testPayload));

    const response = await fetch(`${baseUrl}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    console.log('📊 Minimal shipment creation status:', response.status);
    
    const result = await response.json();
    console.log('📝 Shipment creation response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Minimal shipment creation successful');
    } else {
      console.log('❌ Minimal shipment creation failed');
      console.log('🔍 Error details:', result.rmk);
      
      if (result.packages && result.packages.length > 0) {
        console.log('🔍 Package details:', result.packages[0]);
        if (result.packages[0].remarks) {
          console.log('🔍 Remarks:', result.packages[0].remarks);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Minimal shipment creation error:', error.message);
  }
}

async function testAPICompliance(token, baseUrl) {
  console.log('📚 Checking API compliance...');
  
  // Check if we're using the correct base URL
  if (baseUrl.includes('staging-express.delhivery.com')) {
    console.log('✅ Using staging environment');
  } else if (baseUrl.includes('track.delhivery.com')) {
    console.log('✅ Using production environment');
  } else {
    console.log('❌ Unknown base URL format');
  }

  // Check token format
  if (token && token.length > 20) {
    console.log('✅ Token format appears correct');
  } else {
    console.log('❌ Token format may be incorrect');
  }

  console.log('📝 Recommendations:');
  console.log('1. Ensure your Delhivery account is active and has API access');
  console.log('2. Verify your token has the correct permissions');
  console.log('3. Check if your account has warehouse/pickup locations configured');
  console.log('4. Contact Delhivery support if issues persist');
}

// Run the diagnostic
diagnoseDelhiveryAPI().catch(console.error);
