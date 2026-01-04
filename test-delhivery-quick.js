#!/usr/bin/env node

/**
 * Quick Delhivery Test Runner
 * Tests basic shipment creation functionality
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

// Configuration
const config = {
  url: 'https://track.delhivery.com/api/cmu/create.json',
  token: envVars.DELHIVERY_API_TOKEN || envVars.DELHIVERY_AUTH_TOKEN,
  warehouse: envVars.DELHIVERY_WAREHOUSE_NAME || 'Main Warehouse'
};

console.log('🚀 Testing Delhivery Shipment Creation');
console.log('📍 API URL:', config.url);
console.log('🔐 Token configured:', config.token ? 'Yes' : 'No');
console.log('🏭 Warehouse:', config.warehouse);

if (!config.token) {
  console.error('❌ Delhivery API token not configured!');
  process.exit(1);
}

/**
 * Test COD Shipment Creation
 */
function testCODShipment() {
  return new Promise((resolve, reject) => {
    const orderId = `TEST_COD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
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
        name: config.warehouse
      }
    };

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

    console.log(`\n🔄 Testing COD Shipment Creation`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`🏭 Pickup Location: ${config.warehouse}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Response Status: ${res.statusCode}`);
        console.log(`📄 Response Headers:`, res.headers);
        
        try {
          const response = JSON.parse(data);
          console.log(`\n✅ Response Data:`, JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log(`\n🎉 Success! Shipment created successfully.`);
            if (response.packages && response.packages.length > 0) {
              console.log(`📦 Waybill Numbers:`, response.packages.map(p => p.waybill));
            }
          } else {
            console.log(`\n⚠️  API returned success: false`);
            console.log(`📝 Error Details:`, response.error || response.message || 'No error message');
          }
          
          resolve(response);
        } catch (error) {
          console.error(`\n❌ JSON Parse Error:`, error.message);
          console.error(`📄 Raw Response:`, data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ Request Error:`, error.message);
      reject(error);
    });

    console.log(`\n📤 Sending Request...`);
    req.write(postData);
    req.end();
  });
}

// Run the test
testCODShipment()
  .then(() => {
    console.log(`\n🎯 Test completed successfully!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n💥 Test failed:`, error.message);
    process.exit(1);
  });
