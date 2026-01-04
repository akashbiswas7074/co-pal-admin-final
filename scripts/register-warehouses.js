#!/usr/bin/env node

/**
 * Delhivery Warehouse Registration Helper
 * This script helps you register warehouses with Delhivery
 */

const https = require('https');
const { URLSearchParams } = require('url');

// Load environment variables
const fs = require('fs');
const path = require('path');

// Check for .env.local or .env
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
const configPath = fs.existsSync(envLocalPath) ? envLocalPath : envPath;

require('dotenv').config({ path: configPath });

const DELHIVERY_AUTH_TOKEN = process.env.DELHIVERY_AUTH_TOKEN;
const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com';
const DELHIVERY_PRODUCTION_URL = process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com';

if (!DELHIVERY_AUTH_TOKEN) {
  console.error('❌ DELHIVERY_AUTH_TOKEN not found in environment variables');
  process.exit(1);
}

console.log('🏪 Delhivery Warehouse Registration Helper\n');

// Function to call Delhivery API
async function callDelhiveryAPI(url, method, data = null) {
  const formData = new URLSearchParams();
  if (data) {
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
  }

  const options = {
    method: method,
    headers: {
      'Authorization': `Token ${DELHIVERY_AUTH_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    }
  };

  if (method === 'POST' || method === 'PUT') {
    options.body = formData;
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to list existing warehouses
async function listWarehouses() {
  console.log('📋 Fetching existing warehouses from Delhivery...\n');
  
  const urls = [
    `${DELHIVERY_BASE_URL}/api/backend/clientwarehouse/all/`,
    `${DELHIVERY_PRODUCTION_URL}/api/backend/clientwarehouse/all/`
  ];

  for (const url of urls) {
    console.log(`🔍 Trying ${url.includes('staging') ? 'staging' : 'production'} API...`);
    
    const result = await callDelhiveryAPI(url, 'GET');
    
    if (result.success) {
      console.log('✅ Success!');
      console.log('📦 Registered warehouses:');
      
      if (result.data && result.data.length > 0) {
        result.data.forEach((warehouse, index) => {
          console.log(`  ${index + 1}. ${warehouse.name} (${warehouse.city}, ${warehouse.pin})`);
        });
      } else {
        console.log('  No warehouses found');
      }
      
      return result.data;
    } else {
      console.log(`❌ Failed (${result.status}):`, result.data);
    }
  }
  
  return null;
}

// Function to register a new warehouse
async function registerWarehouse(warehouseData) {
  console.log('🏗️  Registering warehouse with Delhivery...\n');
  
  const urls = [
    `${DELHIVERY_BASE_URL}/api/backend/clientwarehouse/create/`,
    `${DELHIVERY_PRODUCTION_URL}/api/backend/clientwarehouse/edit/`
  ];

  for (const url of urls) {
    console.log(`🔍 Trying ${url.includes('staging') ? 'staging' : 'production'} API...`);
    
    const result = await callDelhiveryAPI(url, 'PUT', warehouseData);
    
    if (result.success) {
      console.log('✅ Warehouse registered successfully!');
      console.log('📦 Response:', result.data);
      return result.data;
    } else {
      console.log(`❌ Failed (${result.status}):`, result.data);
    }
  }
  
  return null;
}

// Main function
async function main() {
  try {
    // First, list existing warehouses
    const existingWarehouses = await listWarehouses();
    
    // Check if we have any warehouses
    if (!existingWarehouses || existingWarehouses.length === 0) {
      console.log('\n🏗️  No warehouses found. Let\'s register one!\n');
      
      // Sample warehouse data - customize this for your needs
      const sampleWarehouse = {
        name: 'Main Warehouse',
        registered_name: 'Your Company Name',
        phone: '9051617498',
        email: 'abworkhouse01@gmail.com',
        address: 'A11 577, Block A, Sector 1',
        city: 'Kalyani',
        pin: '741235',
        country: 'India',
        return_address: 'A11 577, Block A, Sector 1',
        return_city: 'Kalyani',
        return_pin: '741235',
        return_state: 'West Bengal',
        return_country: 'India'
      };
      
      console.log('📝 Sample warehouse data:');
      console.log(JSON.stringify(sampleWarehouse, null, 2));
      console.log('\n⚠️  Please review and customize this data before registering\n');
      
      // Register the warehouse
      const result = await registerWarehouse(sampleWarehouse);
      
      if (result) {
        console.log('\n✅ Warehouse registration completed!');
        console.log('💡 You can now use this warehouse name in your shipment creation');
      } else {
        console.log('\n❌ Warehouse registration failed');
        console.log('💡 Please check your API credentials and try again');
      }
    } else {
      console.log('\n✅ You have existing warehouses registered');
      console.log('💡 Use one of these warehouse names when creating shipments');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
main();
