#!/usr/bin/env node

/**
 * Quick Delhivery Warehouse Checker
 * Check what warehouses are registered in your Delhivery account
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
const configPath = fs.existsSync(envLocalPath) ? envLocalPath : envPath;
require('dotenv').config({ path: configPath });

const DELHIVERY_AUTH_TOKEN = process.env.DELHIVERY_AUTH_TOKEN;
const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com';
const DELHIVERY_PRODUCTION_URL = process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com';

console.log('🏪 Delhivery Warehouse Checker\n');

if (!DELHIVERY_AUTH_TOKEN) {
  console.error('❌ DELHIVERY_AUTH_TOKEN not found in environment variables');
  process.exit(1);
}

async function checkWarehouses() {
  const urls = [
    `${DELHIVERY_BASE_URL}/api/backend/clientwarehouse/all/`,
    `${DELHIVERY_PRODUCTION_URL}/api/backend/clientwarehouse/all/`
  ];

  for (const url of urls) {
    console.log(`🔍 Checking ${url.includes('staging') ? 'staging' : 'production'} warehouses...`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${DELHIVERY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log(`📊 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        console.log('📦 Warehouses found:', data.length || 0);
        
        if (data && data.length > 0) {
          console.log('\n🏠 Your registered warehouses:');
          data.forEach((warehouse, index) => {
            console.log(`  ${index + 1}. ${warehouse.name} (${warehouse.city || 'Unknown city'}, ${warehouse.pin || 'Unknown pin'})`);
          });
        } else {
          console.log('⚠️  No warehouses found in your account');
        }
        
        return data;
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
  
  return null;
}

// Quick warehouse registration function
async function registerQuickWarehouse() {
  console.log('\n🏗️  Registering a default warehouse...');
  
  const warehouseData = {
    name: 'Main Warehouse',
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

  const url = `${DELHIVERY_PRODUCTION_URL}/api/backend/clientwarehouse/edit/`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Token ${DELHIVERY_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(warehouseData)
    });

    console.log(`📊 Registration response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Warehouse registered successfully!');
      console.log('📦 Response:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log(`❌ Registration failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Registration error: ${error.message}`);
  }
  
  return null;
}

async function main() {
  const warehouses = await checkWarehouses();
  
  if (!warehouses || warehouses.length === 0) {
    console.log('\n💡 No warehouses found. Would you like to register a default warehouse?');
    console.log('💡 This will create a warehouse named "Main Warehouse" with default details.');
    
    // For now, let's register a default warehouse
    await registerQuickWarehouse();
    
    // Check again after registration
    console.log('\n🔄 Checking warehouses again after registration...');
    await checkWarehouses();
  } else {
    console.log('\n✅ You have registered warehouses! Use one of these names in your shipments.');
  }
}

main().catch(console.error);
