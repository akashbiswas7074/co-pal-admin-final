import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

/**
 * Warehouse API - Fetch warehouses from Delhivery
 */

export async function GET(request: NextRequest) {
  try {
    console.log('[Warehouse API] Fetching warehouses from Delhivery');

    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured'
      }, { status: 500 });
    }

    const warehouses = await delhiveryAPI.fetchWarehouses();
    
    // Transform warehouses to consistent format
    const transformedWarehouses = warehouses.map(w => ({
      name: w.name || w.warehouse_name || 'Unknown Warehouse',
      address: w.address || w.warehouse_address || 'No address',
      pincode: w.pin || w.pincode || w.warehouse_pin || '000000',
      phone: w.phone || w.warehouse_phone || '+919876543210',
      city: w.city || w.warehouse_city || 'Unknown City',
      state: w.state || w.warehouse_state || 'Unknown State',
      active: true
    }));

    return NextResponse.json({
      success: true,
      data: transformedWarehouses,
      count: transformedWarehouses.length
    });
  } catch (error: any) {
    console.error('[Warehouse API] Error fetching warehouses:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch warehouses'
    }, { status: 500 });
  }
}
