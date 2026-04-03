#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏭 Production Warehouse Configuration Checker\n');

// Check if environment file exists
const envFiles = ['.env.local', '.env'];
let envFound = false;
let envPath = '';

for (const envFile of envFiles) {
  const fullPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Environment file (${envFile}): ✅ Found`);
    envFound = true;
    envPath = fullPath;
    break;
  }
}

if (!envFound) {
  console.log('📁 Environment file: ❌ Not found');
  console.log('⚠️  Please create a .env file with production configuration');
  process.exit(1);
}

console.log(`🔧 Using configuration from: ${path.basename(envPath)}\n`);

// Read environment file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for production-specific variables
const requiredVars = [
  'DELHIVERY_AUTH_TOKEN',
  'DELHIVERY_PRODUCTION_URL',
  'MONGODB_URI'
];

const optionalVars = [
  'DELHIVERY_B2B_USERNAME',
  'DELHIVERY_B2B_PASSWORD'
];

console.log('📋 Production Configuration Status:');

let allRequired = true;
for (const variable of requiredVars) {
  const hasVar = envContent.includes(variable);
  const status = hasVar ? '✅' : '❌';
  console.log(`${status} ${variable}: ${hasVar ? 'Configured' : 'Missing'}`);
  if (!hasVar) allRequired = false;
}

console.log('\n📋 Optional Configuration:');
for (const variable of optionalVars) {
  const hasVar = envContent.includes(variable);
  const status = hasVar ? '✅' : '⚪';
  console.log(`${status} ${variable}: ${hasVar ? 'Configured' : 'Not set'}`);
}

// Check if staging URL is disabled
const hasStagingUrl = envContent.includes('DELHIVERY_BASE_URL=https://staging-express.delhivery.com');
const stagingDisabled = envContent.includes('# DELHIVERY_BASE_URL=') || !hasStagingUrl;

console.log('\n🏭 Production Mode Status:');
console.log(`${stagingDisabled ? '✅' : '⚠️'} Staging URL disabled: ${stagingDisabled ? 'Yes' : 'No'}`);

if (!stagingDisabled) {
  console.log('💡 Recommendation: Comment out DELHIVERY_BASE_URL to ensure production-only mode');
}

// Extract token for validation
const tokenMatch = envContent.match(/DELHIVERY_AUTH_TOKEN=([^\n\r]+)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

if (token) {
  console.log(`🔍 Token preview: ${token.substring(0, 8)}...`);
  console.log(`📏 Token length: ${token.length} characters`);
  
  if (token.length < 30) {
    console.log('⚠️  Warning: Token seems too short for production use');
  }
} else {
  console.log('❌ No token found');
}

// Check Node environment
const nodeEnv = envContent.includes('NODE_ENV=production');
console.log(`🌟 NODE_ENV=production: ${nodeEnv ? '✅ Set' : '⚠️ Not set'}`);

console.log('\n🔍 Testing production API connectivity...');

async function testProductionAPI() {
  try {
    const productionUrl = 'https://track.delhivery.com';
    console.log(`🧪 Testing production API: ${productionUrl}`);
    
    // Simple connectivity test
    const response = await fetch(`${productionUrl}/api/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ Authentication failed - invalid production token');
    } else if (response.status === 200) {
      console.log('✅ Production API connection successful');
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Production API test failed: ${error.message}`);
  }
}

if (token && allRequired) {
  testProductionAPI().then(() => {
    console.log('\n📊 Production Configuration Summary:');
    console.log(`  Required Variables: ${allRequired ? '✅' : '❌'} ${allRequired ? 'All configured' : 'Missing variables'}`);
    console.log(`  Production Mode: ${stagingDisabled ? '✅' : '⚠️'} ${stagingDisabled ? 'Active' : 'Staging fallback enabled'}`);
    console.log(`  Token Status: ${token ? '✅' : '❌'} ${token ? 'Present' : 'Missing'}`);
    
    if (allRequired && stagingDisabled && token) {
      console.log('\n🎉 Production Warehouse System is ready!');
      console.log('\n📋 Next steps:');
      console.log('  1. Start the server: npm run dev');
      console.log('  2. Test warehouse creation with production API');
      console.log('  3. Monitor API responses for production integration');
    } else {
      console.log('\n⚠️  Production setup incomplete. Please review the errors above.');
    }
  });
} else {
  console.log('\n📊 Production Configuration Summary:');
  console.log('❌ Configuration incomplete - cannot test API connectivity');
  console.log('\n🔧 Required actions:');
  if (!allRequired) console.log('  - Configure all required environment variables');
  if (!token) console.log('  - Set valid Delhivery production API token');
  if (!stagingDisabled) console.log('  - Disable staging URL to ensure production-only mode');
}
