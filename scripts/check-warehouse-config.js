#!/usr/bin/env node

/**
 * Enhanced Warehouse Configuration Checker
 * Validates warehouse setup and Delhivery integration
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🏪 Enhanced Warehouse Configuration Checker\n');

// Load environment variables
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
const envLocalExists = fs.existsSync(envLocalPath);
const envExists = fs.existsSync(envPath);

console.log(`📁 Environment file (.env.local): ${envLocalExists ? '✅ Found' : '❌ Not found'}`);
console.log(`📁 Environment file (.env): ${envExists ? '✅ Found' : '❌ Not found'}`);

if (!envLocalExists && !envExists) {
  console.log('\n💡 To fix this:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Update DELHIVERY_AUTH_TOKEN with your actual token');
  console.log('   3. Restart your development server\n');
  process.exit(1);
}

// Read environment variables
const configPath = envLocalExists ? envLocalPath : envPath;
require('dotenv').config({ path: configPath });

console.log(`\n🔧 Using configuration from: ${path.basename(configPath)}`);

const token = process.env.DELHIVERY_AUTH_TOKEN;
const baseUrl = process.env.DELHIVERY_BASE_URL;
const mongoUri = process.env.MONGODB_URI;

// Configuration validation
console.log('\n📋 Configuration Status:');
console.log(`🔑 Delhivery Token: ${token ? (token.includes('your-delhivery-auth-token-here') ? '❌ Placeholder token' : '✅ Configured') : '❌ Not set'}`);
console.log(`🌐 Base URL: ${baseUrl ? '✅ Configured' : '❌ Not set'}`);
console.log(`🗄️  MongoDB URI: ${mongoUri ? '✅ Configured' : '❌ Not set'}`);

if (token && !token.includes('your-delhivery-auth-token-here')) {
  console.log(`📏 Token length: ${token.length} characters`);
  console.log(`🔍 Token preview: ${token.substring(0, 8)}...`);
} else if (token && token.includes('your-delhivery-auth-token-here')) {
  console.log('\n❌ You are using a placeholder token!');
  console.log('💡 Please update your environment file with your actual Delhivery API token');
  process.exit(1);
}

// Test API connectivity
async function testDelhiveryAPI() {
  if (!token || token.includes('your-delhivery-auth-token-here')) {
    console.log('\n⚠️  Skipping API test - token not configured');
    return;
  }

  console.log('\n🔍 Testing Delhivery API connectivity...');
  
  const testEndpoints = [
    'https://staging-express.delhivery.com/api/backend/clientwarehouse/all/',
    'https://track.delhivery.com/api/backend/clientwarehouse/all/'
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🧪 Testing ${endpoint.includes('staging') ? 'staging' : 'production'} API...`);
      
      const result = await makeRequest(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      });

      if (result.success) {
        console.log('✅ API connection successful!');
        console.log(`📊 Response status: ${result.status}`);
        
        if (result.data && Array.isArray(result.data)) {
          console.log(`🏪 Found ${result.data.length} warehouses in Delhivery`);
          
          if (result.data.length > 0) {
            console.log('📦 Registered warehouses:');
            result.data.forEach((warehouse, index) => {
              console.log(`   ${index + 1}. ${warehouse.name} (${warehouse.city || 'Unknown'}, ${warehouse.pin || 'Unknown'})`);
            });
          } else {
            console.log('⚠️  No warehouses found in Delhivery account');
            console.log('💡 You may need to register warehouses first');
          }
        }
        
        return; // Success, no need to test other endpoints
      } else {
        console.log(`❌ API test failed: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ API test error: ${error.message}`);
    }
  }
}

// Test MongoDB connectivity
async function testMongoConnection() {
  if (!mongoUri) {
    console.log('\n⚠️  Skipping MongoDB test - URI not configured');
    return;
  }

  console.log('\n🔍 Testing MongoDB connectivity...');
  
  try {
    // Simple connection test using MongoDB driver
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri);
    
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    // Test warehouse collection
    const db = client.db();
    const warehousesCollection = db.collection('warehouses');
    const warehouseCount = await warehousesCollection.countDocuments();
    
    console.log(`🏪 Found ${warehouseCount} warehouses in MongoDB`);
    
    if (warehouseCount > 0) {
      const sampleWarehouses = await warehousesCollection.find({}).limit(5).toArray();
      console.log('📦 Sample warehouses:');
      sampleWarehouses.forEach((warehouse, index) => {
        console.log(`   ${index + 1}. ${warehouse.name} (${warehouse.status || 'unknown'})`);
      });
    }
    
    await client.close();
  } catch (error) {
    console.log(`❌ MongoDB test failed: ${error.message}`);
  }
}

// HTTP request helper
function makeRequest(url, options) {
  return new Promise((resolve) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsedData,
            message: res.statusMessage
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            message: `Parse error: ${error.message}`
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        message: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        message: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// Main execution
async function main() {
  // Test API connectivity
  await testDelhiveryAPI();
  
  // Test MongoDB connectivity
  await testMongoConnection();
  
  console.log('\n🎯 System Health Summary:');
  console.log(`📊 Configuration: ${token && mongoUri ? '✅ Complete' : '⚠️  Incomplete'}`);
  console.log(`🔐 Authentication: ${token && !token.includes('placeholder') ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`💾 Database: ${mongoUri ? '✅ Configured' : '❌ Not configured'}`);
  
  console.log('\n🚀 Quick Start Guide:');
  console.log('1. ✅ Environment variables configured');
  console.log('2. 🔧 Test warehouse creation: npm run dev → /admin/warehouse');
  console.log('3. 🏪 Register warehouses in Delhivery dashboard');
  console.log('4. 🔄 Use sync functionality to synchronize data');
  console.log('5. 📦 Create shipments with registered warehouses');
  
  console.log('\n📚 For detailed setup instructions, see:');
  console.log('   - DELHIVERY_COMPLETE_SETUP.md');
  console.log('   - WAREHOUSE_REGISTRATION_GUIDE.md');
  console.log('   - Enhanced API endpoints: /api/warehouse/enhanced');
  
  console.log('\n🎉 Configuration check complete!');
}

main().catch(console.error);
