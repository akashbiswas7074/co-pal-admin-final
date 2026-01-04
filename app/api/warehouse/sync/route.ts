import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';

/**
 * Warehouse Synchronization API
 * Synchronizes warehouse data between MongoDB and Delhivery system
 */

interface DelhiveryWarehouse {
  name: string;
  address: string;
  pin: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  registered_name?: string;
  email?: string;
  return_address?: string;
  return_city?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
  status?: string;
  active?: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

// Enhanced Delhivery API handler for listing warehouses
async function fetchDelhiveryWarehouses(): Promise<{ success: boolean; data?: DelhiveryWarehouse[]; message?: string }> {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  
  if (!token) {
    console.warn('[Warehouse Sync] DELHIVERY_AUTH_TOKEN not configured');
    return { success: false, message: 'API token not configured' };
  }

  const endpoints = [
    'https://track.delhivery.com/api/backend/clientwarehouse/all/'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`[Warehouse Sync] Fetching from: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`[Warehouse Sync] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Warehouse Sync] Found ${data.length || 0} warehouses`);
        return { success: true, data: data || [] };
      } else if (response.status === 401) {
        console.error('[Warehouse Sync] Authentication failed');
        return { success: false, message: 'Invalid API token' };
      } else {
        const errorText = await response.text();
        console.error(`[Warehouse Sync] API error (${response.status}):`, errorText);
        continue; // Try next endpoint
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[Warehouse Sync] Request timeout');
        return { success: false, message: 'Request timeout' };
      }
      console.error(`[Warehouse Sync] Network error:`, error);
      continue; // Try next endpoint
    }
  }

  return { success: false, message: 'Failed to fetch warehouses from all endpoints' };
}

// Register warehouse with Delhivery
async function registerWarehouseWithDelhivery(warehouseData: any): Promise<{ success: boolean; message?: string; data?: any }> {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  
  if (!token) {
    return { success: false, message: 'API token not configured' };
  }

  const endpoints = [
    'https://track.delhivery.com/api/backend/clientwarehouse/edit/'
  ];

  const registrationData = {
    name: warehouseData.name,
    registered_name: warehouseData.registered_name || warehouseData.name,
    phone: warehouseData.phone,
    email: warehouseData.email,
    address: warehouseData.address,
    city: warehouseData.city,
    pin: warehouseData.pin,
    country: warehouseData.country || 'India',
    return_address: warehouseData.return_address || warehouseData.address,
    return_city: warehouseData.return_city || warehouseData.city,
    return_pin: warehouseData.return_pin || warehouseData.pin,
    return_state: warehouseData.return_state || warehouseData.state,
    return_country: warehouseData.return_country || warehouseData.country || 'India'
  };

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const method = i === 0 ? 'PUT' : 'POST';
    
    try {
      console.log(`[Warehouse Sync] Registering with: ${method} ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registrationData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Warehouse Sync] Registration successful:`, data);
        return { success: true, data, message: 'Warehouse registered successfully' };
      } else {
        const errorText = await response.text();
        console.error(`[Warehouse Sync] Registration failed (${response.status}):`, errorText);
        continue; // Try next endpoint
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[Warehouse Sync] Registration timeout');
        return { success: false, message: 'Registration timeout' };
      }
      console.error(`[Warehouse Sync] Registration error:`, error);
      continue; // Try next endpoint
    }
  }

  return { success: false, message: 'Failed to register warehouse with all endpoints' };
}

// POST: Synchronize warehouses
export async function POST(request: NextRequest) {
  console.log('[Warehouse Sync] POST request received');
  
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions (only admins can sync warehouses)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admins can sync warehouses.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const { action, warehouseId } = await request.json();
    
    if (action === 'sync-from-delhivery') {
      return await syncFromDelhivery();
    } else if (action === 'sync-to-delhivery') {
      return await syncToDelhivery(warehouseId);
    } else if (action === 'full-sync') {
      return await fullSync();
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use: sync-from-delhivery, sync-to-delhivery, or full-sync' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Warehouse Sync] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Sync operation failed'
    }, { status: 500 });
  }
}

// Sync warehouses from Delhivery to MongoDB
async function syncFromDelhivery(): Promise<NextResponse> {
  console.log('[Warehouse Sync] Starting sync from Delhivery...');
  
  const delhiveryResult = await fetchDelhiveryWarehouses();
  
  if (!delhiveryResult.success) {
    return NextResponse.json({
      success: false,
      error: delhiveryResult.message || 'Failed to fetch warehouses from Delhivery'
    }, { status: 500 });
  }

  const delhiveryWarehouses = delhiveryResult.data || [];
  console.log(`[Warehouse Sync] Found ${delhiveryWarehouses.length} warehouses in Delhivery`);

  const syncResults = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const delhiveryWarehouse of delhiveryWarehouses) {
    try {
      // Check if warehouse already exists in MongoDB
      const existingWarehouse = await Warehouse.findOne({ name: delhiveryWarehouse.name });

      if (existingWarehouse) {
        // Update existing warehouse
        const updateFields = {
          phone: delhiveryWarehouse.phone,
          address: delhiveryWarehouse.address,
          city: delhiveryWarehouse.city,
          pin: delhiveryWarehouse.pin,
          state: delhiveryWarehouse.state,
          country: delhiveryWarehouse.country,
          return_address: delhiveryWarehouse.return_address,
          return_city: delhiveryWarehouse.return_city,
          return_pin: delhiveryWarehouse.return_pin,
          return_state: delhiveryWarehouse.return_state,
          return_country: delhiveryWarehouse.return_country,
          status: delhiveryWarehouse.active ? 'active' : 'inactive',
          updatedAt: new Date()
        };

        await Warehouse.findByIdAndUpdate(existingWarehouse._id, updateFields);
        syncResults.updated++;
        console.log(`[Warehouse Sync] Updated warehouse: ${delhiveryWarehouse.name}`);
      } else {
        // Create new warehouse
        const newWarehouse = new Warehouse({
          name: delhiveryWarehouse.name,
          registered_name: delhiveryWarehouse.registered_name,
          phone: delhiveryWarehouse.phone,
          email: delhiveryWarehouse.email,
          address: delhiveryWarehouse.address,
          city: delhiveryWarehouse.city,
          pin: delhiveryWarehouse.pin,
          state: delhiveryWarehouse.state,
          country: delhiveryWarehouse.country,
          return_address: delhiveryWarehouse.return_address || delhiveryWarehouse.address,
          return_city: delhiveryWarehouse.return_city || delhiveryWarehouse.city,
          return_pin: delhiveryWarehouse.return_pin || delhiveryWarehouse.pin,
          return_state: delhiveryWarehouse.return_state || delhiveryWarehouse.state,
          return_country: delhiveryWarehouse.return_country || delhiveryWarehouse.country,
          status: delhiveryWarehouse.active ? 'active' : 'inactive',
          createdBy: 'system',
          vendorId: 'admin'
        });

        await newWarehouse.save();
        syncResults.created++;
        console.log(`[Warehouse Sync] Created warehouse: ${delhiveryWarehouse.name}`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to sync warehouse ${delhiveryWarehouse.name}: ${error.message}`;
      syncResults.errors.push(errorMsg);
      console.error(`[Warehouse Sync] ${errorMsg}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Sync from Delhivery completed. Created: ${syncResults.created}, Updated: ${syncResults.updated}, Errors: ${syncResults.errors.length}`,
    data: {
      created: syncResults.created,
      updated: syncResults.updated,
      skipped: syncResults.skipped,
      errors: syncResults.errors,
      totalProcessed: delhiveryWarehouses.length
    }
  });
}

// Sync warehouses from MongoDB to Delhivery
async function syncToDelhivery(warehouseId?: string): Promise<NextResponse> {
  console.log('[Warehouse Sync] Starting sync to Delhivery...');
  
  // Get warehouses from MongoDB
  const query = warehouseId ? { _id: warehouseId } : { status: 'active' };
  const mongoWarehouses = await Warehouse.find(query);
  
  console.log(`[Warehouse Sync] Found ${mongoWarehouses.length} warehouses in MongoDB`);

  const syncResults = {
    registered: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const warehouse of mongoWarehouses) {
    try {
      // Skip if already has successful Delhivery response
      if (warehouse.delhiveryResponse && warehouse.delhiveryResponse.success) {
        syncResults.skipped++;
        console.log(`[Warehouse Sync] Skipped warehouse: ${warehouse.name} (already registered)`);
        continue;
      }

      // Try to register with Delhivery
      const registrationResult = await registerWarehouseWithDelhivery(warehouse);

      if (registrationResult.success) {
        // Update warehouse with Delhivery response
        await Warehouse.findByIdAndUpdate(warehouse._id, {
          delhiveryResponse: registrationResult.data,
          status: 'active',
          updatedAt: new Date()
        });

        syncResults.registered++;
        console.log(`[Warehouse Sync] Registered warehouse: ${warehouse.name}`);
      } else {
        syncResults.failed++;
        const errorMsg = `Failed to register warehouse ${warehouse.name}: ${registrationResult.message}`;
        syncResults.errors.push(errorMsg);
        console.error(`[Warehouse Sync] ${errorMsg}`);
      }
    } catch (error: any) {
      syncResults.failed++;
      const errorMsg = `Error processing warehouse ${warehouse.name}: ${error.message}`;
      syncResults.errors.push(errorMsg);
      console.error(`[Warehouse Sync] ${errorMsg}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Sync to Delhivery completed. Registered: ${syncResults.registered}, Failed: ${syncResults.failed}, Skipped: ${syncResults.skipped}`,
    data: {
      registered: syncResults.registered,
      failed: syncResults.failed,
      skipped: syncResults.skipped,
      errors: syncResults.errors,
      totalProcessed: mongoWarehouses.length
    }
  });
}

// Full bidirectional sync
async function fullSync(): Promise<NextResponse> {
  console.log('[Warehouse Sync] Starting full sync...');
  
  try {
    // First sync from Delhivery to MongoDB
    const fromDelhiveryResult = await syncFromDelhivery();
    const fromDelhiveryData = await fromDelhiveryResult.json();

    // Then sync from MongoDB to Delhivery
    const toDelhiveryResult = await syncToDelhivery();
    const toDelhiveryData = await toDelhiveryResult.json();

    return NextResponse.json({
      success: true,
      message: 'Full sync completed successfully',
      data: {
        fromDelhivery: fromDelhiveryData.data,
        toDelhivery: toDelhiveryData.data,
        summary: {
          totalCreated: fromDelhiveryData.data.created,
          totalUpdated: fromDelhiveryData.data.updated,
          totalRegistered: toDelhiveryData.data.registered,
          totalErrors: (fromDelhiveryData.data.errors?.length || 0) + (toDelhiveryData.data.errors?.length || 0)
        }
      }
    });
  } catch (error: any) {
    console.error('[Warehouse Sync] Full sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Full sync failed'
    }, { status: 500 });
  }
}

// GET: Get sync status
export async function GET(request: NextRequest) {
  console.log('[Warehouse Sync] GET request received');
  
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get warehouse statistics
    const [totalWarehouses, activeWarehouses, pendingWarehouses, withDelhiveryResponse] = await Promise.all([
      Warehouse.countDocuments(),
      Warehouse.countDocuments({ status: 'active' }),
      Warehouse.countDocuments({ status: 'pending' }),
      Warehouse.countDocuments({ delhiveryResponse: { $exists: true, $ne: null } })
    ]);

    // Get recent warehouse activity
    const recentWarehouses = await Warehouse.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name status createdAt updatedAt')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          total: totalWarehouses,
          active: activeWarehouses,
          pending: pendingWarehouses,
          synced: withDelhiveryResponse,
          needsSync: totalWarehouses - withDelhiveryResponse
        },
        recentActivity: recentWarehouses.map((w: any) => ({
          id: w._id.toString(),
          name: w.name,
          status: w.status,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt
        }))
      }
    });

  } catch (error: any) {
    console.error('[Warehouse Sync] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch sync status'
    }, { status: 500 });
  }
}
