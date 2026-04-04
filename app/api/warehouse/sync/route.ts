import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';
import { DelhiveryAPI } from '@/lib/shipment/delhivery-api';

const delhivery = new DelhiveryAPI();

export async function GET(request: NextRequest) {
  console.log('[Warehouse Sync API] GET status check');
  try {
    const isConfigured = !!(process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN);
    return NextResponse.json({ 
      success: isConfigured, 
      status: isConfigured ? 'configured' : 'misconfigured',
      environment: 'PRODUCTION' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('[Warehouse Sync API] POST request received');

  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = currentUser.id || 'default';

    // 1. Fetch all warehouses from Delhivery
    console.log('[Warehouse Sync API] Fetching warehouses from Delhivery...');
    const delhiveryWarehouses = await delhivery.fetchWarehouses();
    
    if (!delhiveryWarehouses || delhiveryWarehouses.length === 0) {
      console.log('[Warehouse Sync API] No warehouses found in Delhivery');
      return NextResponse.json({
        success: true,
        message: 'No pickup locations found in Delhivery to sync.',
        count: 0
      });
    }

    console.log(`[Warehouse Sync API] Found ${delhiveryWarehouses.length} locations in Delhivery`);
    console.log('[Warehouse Sync API] First 2 warehouse names:', delhiveryWarehouses.slice(0, 2).map((w: any) => w.name || w.warehouse_name || w.pickup_location));


    // 2. Sync with local database
    let syncedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const skippedDetails: string[] = [];

    for (const dw of delhiveryWarehouses) {
      // Robust normalized field extraction
      const dwName = dw.name || dw.warehouse_name || dw.pickup_location || dw.location_name;
      const dwPhone = dw.phone || dw.warehouse_phone || dw.contact_no || dw.phone_number || dw.contact || 'N/A';
      const dwPin = dw.pin || dw.pincode || dw.warehouse_pin || dw.zip || dw.zip_code || '';
      const dwAddress = dw.address || dw.warehouse_address || dw.pickup_address || dw.full_address || '';
      const dwCity = dw.city || dw.warehouse_city || dw.district || '';
      const dwState = dw.state || dw.warehouse_state || dw.province || '';

      // Skip if missing critical info (name or pin)
      if (!dwName || !dwPin) {
        skippedCount++;
        skippedDetails.push(`Skipped: ${dwName || 'Unknown'} (Missing ${!dwName ? 'Name' : 'Pin'})`);
        console.log(`[Warehouse Sync API] Skipping warehouse: ${JSON.stringify(dw).substring(0, 50)}...`);
        continue;
      }

      // Find existing warehouse by name (case-insensitive) and vendorId
      const existing = await Warehouse.findOne({
        name: { $regex: new RegExp(`^${dwName.trim()}$`, 'i') },
        vendorId: vendorId
      });

      try {
        if (existing) {
          // Update existing
          existing.phone = dwPhone !== 'N/A' ? dwPhone : existing.phone;
          existing.pin = dwPin;
          existing.address = dwAddress || existing.address;
          existing.city = dwCity || existing.city;
          existing.state = dwState || existing.state;
          existing.status = 'active';
          existing.delhiveryResponse = dw;
          await existing.save();
          updatedCount++;
        } else {
          // Create new
          const newWarehouse = new Warehouse({
            name: dwName.trim(),
            phone: dwPhone,
            pin: dwPin,
            address: dwAddress,
            city: dwCity,
            state: dwState,
            return_address: dwAddress || 'Self Pickup', // Fallback
            return_city: dwCity,
            return_pin: dwPin,
            status: 'active',
            vendorId,
            createdBy: currentUser.id,
            delhiveryResponse: dw,
            isDefault: syncedCount === 0 && (await Warehouse.countDocuments({ vendorId })) === 0
          });
          await newWarehouse.save();
          syncedCount++;
        }
      } catch (err: any) {
        console.error(`[Warehouse Sync API] Error saving ${dwName}:`, err.message);
        skippedCount++;
        skippedDetails.push(`Error: ${dwName} - ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${syncedCount} new, ${updatedCount} updated. ${skippedCount > 0 ? `(${skippedCount} skipped)` : ''}`,
      data: {
        new: syncedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: syncedCount + updatedCount,
        details: skippedDetails
      }
    });

  } catch (error: any) {
    console.error('[Warehouse Sync API] Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to sync warehouses with Delhivery'
    }, { status: 500 });
  }
}
