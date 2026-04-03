#!/usr/bin/env node

/**
 * Delhivery API Configuration Checker
 * Run this script to verify your Delhivery API setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Delhivery API Configuration Checker\n');

// Check if .env.local or .env exists
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

// Read environment variables from the available file
const configPath = envLocalExists ? envLocalPath : envPath;
require('dotenv').config({ path: configPath });

console.log(`\n🔧 Using configuration from: ${path.basename(configPath)}`);

const token = process.env.DELHIVERY_AUTH_TOKEN;
const baseUrl = process.env.DELHIVERY_BASE_URL;
const mongoUri = process.env.MONGODB_URI;

// Check token configuration
console.log(`🔑 Delhivery Token: ${token ? (token.includes('your-delhivery-auth-token-here') ? '❌ Placeholder token' : '✅ Configured') : '❌ Not set'}`);
console.log(`🌐 Base URL: ${baseUrl ? '✅ Configured' : '❌ Not set'}`);
console.log(`🗄️  MongoDB URI: ${mongoUri ? '✅ Configured' : '❌ Not set'}`);

// Check if token is valid format
if (token && !token.includes('your-delhivery-auth-token-here')) {
  console.log(`📏 Token length: ${token.length} characters`);
  console.log(`🔍 Token preview: ${token.substring(0, 8)}...`);
} else if (token && token.includes('your-delhivery-auth-token-here')) {
  console.log('\n❌ You are using a placeholder token!');
  console.log('💡 Please update your environment file with your actual Delhivery API token');
}

// Final recommendations
console.log('\n📋 Configuration Status:');
if (token && !token.includes('your-delhivery-auth-token-here') && baseUrl && mongoUri) {
  console.log('✅ Configuration looks good! Try creating a shipment to test the API.');
} else {
  console.log('❌ Configuration incomplete. Please fix the issues above.');
  console.log('\n💡 Setup steps:');
  console.log('   1. Get your API token from Delhivery Business dashboard');
  console.log('   2. Update DELHIVERY_AUTH_TOKEN in your environment file');
  console.log('   3. Restart your development server');
  console.log('   4. Test by creating a shipment in the admin panel');
}

console.log('\n📚 For detailed setup instructions, see DELHIVERY_COMPLETE_SETUP.md');
