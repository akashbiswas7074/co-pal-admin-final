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
    
    // Transform warehouses to consistent format using robust mapping
    const transformedWarehouses = warehouses.map((w: any) => {
      const name = w.name || w.warehouse_name || w.pickup_location || w.location_name || 'Unknown Warehouse';
      const phone = w.phone || w.warehouse_phone || w.contact_no || w.phone_number || w.contact || '+919876543210';
      const pincode = w.pin || w.pincode || w.warehouse_pin || w.zip || w.zip_code || '000000';
      const address = w.address || w.warehouse_address || w.pickup_address || w.full_address || 'No address';
      const city = w.city || w.warehouse_city || w.district || 'Unknown City';
      const state = w.state || w.warehouse_state || w.province || 'Unknown State';

      return {
        name: name.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        active: true
      };
    });

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
