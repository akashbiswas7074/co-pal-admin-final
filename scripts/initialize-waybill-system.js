#!/usr/bin/env node

/**
 * Initialize Waybill System
 * Pre-generates waybills and stores them in the database
 * This should be run during system setup or as a cron job
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function initializeWaybillSystem() {
  console.log('🚀 Initializing Waybill System');
  console.log('API Base URL:', API_BASE);
  console.log('='.repeat(50));

  try {
    // Step 1: Check current stock
    console.log('\n📊 Step 1: Checking current waybill stock...');
    const stockResponse = await fetch(`${API_BASE}/api/shipment/waybill/manage?action=stock`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!stockResponse.ok) {
      throw new Error(`HTTP ${stockResponse.status}: ${stockResponse.statusText}`);
    }

    const stockResult = await stockResponse.json();
    console.log('📊 Current stock:', JSON.stringify(stockResult.data, null, 2));

    const currentStock = stockResult.data.available;
    const minStock = 500; // Minimum stock to maintain

    // Step 2: Generate initial stock if needed
    if (currentStock < minStock) {
      const needed = minStock - currentStock;
      console.log(`\n📦 Step 2: Generating ${needed} waybills to reach minimum stock of ${minStock}...`);
      
      const generateResponse = await fetch(`${API_BASE}/api/shipment/waybill/manage`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          count: needed,
          source: 'DEMO' // Use 'DELHIVERY_BULK' for production
        })
      });

      if (!generateResponse.ok) {
        throw new Error(`HTTP ${generateResponse.status}: ${generateResponse.statusText}`);
      }

      const generateResult = await generateResponse.json();
      console.log('✅ Generated waybills:', generateResult.data.count);
    } else {
      console.log('✅ Stock is sufficient, no generation needed');
    }

    // Step 3: Ensure minimum stock (this will check and replenish if needed)
    console.log('\n🏪 Step 3: Ensuring minimum stock...');
    const ensureResponse = await fetch(`${API_BASE}/api/shipment/waybill/manage`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ensure_stock',
        minStock: minStock
      })
    });

    if (!ensureResponse.ok) {
      throw new Error(`HTTP ${ensureResponse.status}: ${ensureResponse.statusText}`);
    }

    const ensureResult = await ensureResponse.json();
    console.log('✅ Stock ensured:', ensureResult.data.currentStock, 'waybills available');

    // Step 4: Final statistics
    console.log('\n📈 Step 4: Final waybill statistics...');
    const finalStatsResponse = await fetch(`${API_BASE}/api/shipment/waybill/manage?action=stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!finalStatsResponse.ok) {
      throw new Error(`HTTP ${finalStatsResponse.status}: ${finalStatsResponse.statusText}`);
    }

    const finalStatsResult = await finalStatsResponse.json();
    const stats = finalStatsResult.data.statistics;
    
    console.log('📊 Final Waybill Statistics:');
    console.log('  - Total waybills:', stats.total);
    console.log('  - Available:', stats.generated);
    console.log('  - Reserved:', stats.reserved);
    console.log('  - Used:', stats.used);
    console.log('  - Cancelled:', stats.cancelled);
    console.log('  - By Source:', JSON.stringify(stats.bySource, null, 2));

    console.log('\n✅ Waybill system initialized successfully!');
    console.log('='.repeat(50));
    
    // Recommendations
    console.log('\n📝 Recommendations:');
    console.log('1. Set up a cron job to run this script daily to maintain stock');
    console.log('2. Monitor waybill usage patterns to optimize stock levels');
    console.log('3. For production, use DELHIVERY_BULK source instead of DEMO');
    console.log('4. Consider implementing alerts for low stock levels');
    
  } catch (error) {
    console.error('❌ Waybill system initialization failed:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeWaybillSystem().catch(console.error);
