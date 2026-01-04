#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏪 Enhanced Warehouse System Verification\n');

// Check if files exist
const requiredFiles = [
  'app/api/warehouse/enhanced/route.ts',
  'app/api/warehouse/enhanced/update/route.ts',
  'app/api/warehouse/sync/route.ts',
  'components/shared/warehouse/EnhancedWarehouseManagement.tsx',
  'components/shared/warehouse/WarehouseCreation.tsx',
  'lib/database/models/warehouse.model.ts',
  'scripts/check-warehouse-config.js',
  'scripts/test-enhanced-warehouse.js'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['check-warehouse', 'test-warehouse'];
  
  for (const script of requiredScripts) {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} ${script}`);
  }
} else {
  console.log('  ❌ package.json not found');
}

// Check environment configuration
console.log('\n🔧 Checking environment configuration:');
const envFiles = ['.env.local', '.env'];
let envFound = false;

for (const envFile of envFiles) {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    console.log(`  ✅ ${envFile} found`);
    envFound = true;
    
    // Check for required variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DELHIVERY_AUTH_TOKEN', 'DELHIVERY_BASE_URL', 'MONGODB_URI'];
    
    for (const variable of requiredVars) {
      const hasVar = envContent.includes(variable);
      console.log(`    ${hasVar ? '✅' : '❌'} ${variable}`);
    }
    break;
  }
}

if (!envFound) {
  console.log('  ❌ No environment file found (.env.local or .env)');
}

// Check TypeScript compilation
console.log('\n🔍 Checking TypeScript compilation:');
const { exec } = require('child_process');

exec('npx tsc --noEmit --skipLibCheck', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.log('  ❌ TypeScript compilation errors found');
    if (stderr) console.log('     Error details:', stderr.split('\n').slice(0, 5).join('\n'));
  } else {
    console.log('  ✅ TypeScript compilation successful');
  }
  
  // Summary
  console.log('\n📊 System Status Summary:');
  console.log(`  Files: ${allFilesExist ? '✅' : '❌'} All required files present`);
  console.log(`  Environment: ${envFound ? '✅' : '❌'} Configuration found`);
  console.log(`  TypeScript: ${error ? '❌' : '✅'} Compilation status`);
  
  if (allFilesExist && envFound && !error) {
    console.log('\n🎉 Enhanced Warehouse System is ready!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Visit /admin/dashboard to access the warehouse management');
    console.log('  3. Use the EnhancedWarehouseManagement component for full functionality');
    console.log('  4. Test the API endpoints with: npm run test-warehouse');
    console.log('\n💡 The system works in demo mode if Delhivery API is unavailable');
  } else {
    console.log('\n⚠️  Some components need attention. Please review the errors above.');
  }
});
