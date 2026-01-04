import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';

/**
 * Enhanced Delhivery Client Warehouse Update API
 * Supports updating warehouse details with improved error handling and MongoDB synchronization
 */

interface WarehouseUpdateData {
  name: string; // Required - warehouse name (cannot be changed)
  address?: string;
  pin?: string;
  phone?: string;
}

interface DelhiveryWarehouseUpdatePayload {
  name: string;
  address?: string;
  pin?: string;
  phone?: string;
}

interface DelhiveryResponse {
  success: boolean;
  message?: string;
  warehouse_name?: string;
  data?: any;
}

// Enhanced Delhivery API handler for updates
async function callDelhiveryUpdateAPI(
  data: DelhiveryWarehouseUpdatePayload,
  retries = 3
): Promise<DelhiveryResponse> {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  
  if (!token) {
    console.warn('[Warehouse Update API] DELHIVERY_AUTH_TOKEN not configured');
    return { success: false, message: 'API token not configured' };
  }

  const endpoints = [
    'https://track.delhivery.com/api/backend/clientwarehouse/edit/',
    'https://track.delhivery.com/api/backend/clientwarehouse/edit/'
  ];

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const endpoint of endpoints) {
      try {
        console.log(`[Warehouse Update API] Attempt ${attempt + 1}: POST ${endpoint}`);
        console.log(`[Warehouse Update API] Update data:`, JSON.stringify(data, null, 2));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log(`[Warehouse Update API] Response status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log('[Warehouse Update API] Success:', responseData);
          return {
            success: true,
            data: responseData,
            message: responseData.message || 'Warehouse updated successfully'
          };
        } else if (response.status === 401) {
          console.error('[Warehouse Update API] Authentication failed - invalid token');
          return { success: false, message: 'Invalid API token' };
        } else if (response.status === 404) {
          console.error('[Warehouse Update API] Warehouse not found in Delhivery system');
          return { success: false, message: 'Warehouse not found in Delhivery system' };
        } else if (response.status === 429) {
          console.warn('[Warehouse Update API] Rate limit exceeded, retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          continue;
        } else {
          const errorText = await response.text();
          console.error(`[Warehouse Update API] API error (${response.status}):`, errorText);
          
          if (attempt === retries - 1) {
            return { 
              success: false, 
              message: `API error: ${response.status} - ${errorText}` 
            };
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('[Warehouse Update API] Request timeout');
          return { success: false, message: 'Request timeout - please try again' };
        }
        
        console.error(`[Warehouse Update API] Network error:`, error);
        
        if (attempt === retries - 1) {
          return { 
            success: false, 
            message: `Network error: ${error.message}` 
          };
        }
      }
    }
  }

  return { success: false, message: 'All update attempts failed' };
}

// Enhanced validation for update data
function validateUpdateData(data: WarehouseUpdateData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Warehouse name is required');
  }

  if (data.pin && !/^\d{6}$/.test(data.pin)) {
    errors.push('Please provide a valid 6-digit pincode');
  }

  if (data.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(data.phone)) {
    errors.push('Please provide a valid phone number');
  }

  if (data.address && data.address.length > 500) {
    errors.push('Address must be less than 500 characters');
  }

  return { isValid: errors.length === 0, errors };
}

// PUT: Update warehouse
export async function PUT(request: NextRequest) {
  console.log('[Warehouse Update API] PUT request received');
  
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    if (currentUser.role !== 'admin' && (currentUser.role !== 'vendor' || !currentUser.verified)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admins and verified vendors can update warehouses.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body: WarehouseUpdateData = await request.json();
    console.log('[Warehouse Update API] Request body:', body);

    // Validate input data
    const validation = validateUpdateData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Find existing warehouse
    const vendorId = currentUser.role === 'vendor' ? currentUser.id : 'admin';
    const warehouseQuery = currentUser.role === 'admin' 
      ? { name: body.name, status: { $ne: 'inactive' } }
      : { name: body.name, vendorId: vendorId, status: { $ne: 'inactive' } };
    
    const existingWarehouse = await Warehouse.findOne(warehouseQuery);

    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Prepare update payload for Delhivery (only include fields that have values)
    const delhiveryUpdatePayload: DelhiveryWarehouseUpdatePayload = {
      name: body.name
    };

    const hasUpdates = [];
    if (body.address && body.address.trim() !== existingWarehouse.address) {
      delhiveryUpdatePayload.address = body.address.trim();
      hasUpdates.push('address');
    }
    if (body.pin && body.pin.trim() !== existingWarehouse.pin) {
      delhiveryUpdatePayload.pin = body.pin.trim();
      hasUpdates.push('pincode');
    }
    if (body.phone && body.phone.trim() !== existingWarehouse.phone) {
      delhiveryUpdatePayload.phone = body.phone.trim();
      hasUpdates.push('phone');
    }

    // If no updates, return success
    if (hasUpdates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected - warehouse is already up to date',
        data: {
          warehouseId: existingWarehouse._id,
          warehouseName: existingWarehouse.name,
          warehouse: {
            id: existingWarehouse._id,
            name: existingWarehouse.name,
            phone: existingWarehouse.phone,
            address: existingWarehouse.address,
            pin: existingWarehouse.pin,
            status: existingWarehouse.status,
            isActive: existingWarehouse.status === 'active',
            updatedAt: existingWarehouse.updatedAt
          }
        }
      });
    }

    // Try to update warehouse with Delhivery
    const delhiveryResponse = await callDelhiveryUpdateAPI(delhiveryUpdatePayload);

    // Prepare MongoDB update fields
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (body.address) updateFields.address = body.address.trim();
    if (body.pin) updateFields.pin = body.pin.trim();
    if (body.phone) updateFields.phone = body.phone.trim();

    // Update warehouse in MongoDB
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      existingWarehouse._id,
      updateFields,
      { new: true }
    );

    if (!updatedWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Failed to update warehouse in database' },
        { status: 500 }
      );
    }

    // Determine response based on Delhivery API result
    if (delhiveryResponse.success) {
      return NextResponse.json({
        success: true,
        message: `Warehouse updated successfully. Updated fields: ${hasUpdates.join(', ')}`,
        data: {
          warehouseId: updatedWarehouse._id,
          warehouseName: updatedWarehouse.name,
          delhiveryResponse: delhiveryResponse.data,
          updatedFields: hasUpdates,
          warehouse: {
            id: updatedWarehouse._id,
            name: updatedWarehouse.name,
            phone: updatedWarehouse.phone,
            email: updatedWarehouse.email,
            address: updatedWarehouse.address,
            city: updatedWarehouse.city,
            pin: updatedWarehouse.pin,
            country: updatedWarehouse.country,
            return_address: updatedWarehouse.return_address,
            status: updatedWarehouse.status,
            isActive: updatedWarehouse.status === 'active',
            createdAt: updatedWarehouse.createdAt,
            updatedAt: updatedWarehouse.updatedAt
          }
        }
      });
    } else {
      // Local update succeeded but Delhivery update failed
      return NextResponse.json({
        success: true,
        message: `Warehouse updated locally but Delhivery sync ${delhiveryResponse.message}. Updated fields: ${hasUpdates.join(', ')}`,
        data: {
          warehouseId: updatedWarehouse._id,
          warehouseName: updatedWarehouse.name,
          delhiveryError: delhiveryResponse.message,
          updatedFields: hasUpdates,
          warehouse: {
            id: updatedWarehouse._id,
            name: updatedWarehouse.name,
            phone: updatedWarehouse.phone,
            email: updatedWarehouse.email,
            address: updatedWarehouse.address,
            city: updatedWarehouse.city,
            pin: updatedWarehouse.pin,
            country: updatedWarehouse.country,
            return_address: updatedWarehouse.return_address,
            status: updatedWarehouse.status,
            isActive: updatedWarehouse.status === 'active',
            createdAt: updatedWarehouse.createdAt,
            updatedAt: updatedWarehouse.updatedAt
          }
        }
      });
    }

  } catch (error: any) {
    console.error('[Warehouse Update API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// DELETE: Deactivate warehouse
export async function DELETE(request: NextRequest) {
  console.log('[Warehouse Update API] DELETE request received');
  
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    if (currentUser.role !== 'admin' && (currentUser.role !== 'vendor' || !currentUser.verified)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admins and verified vendors can delete warehouses.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('id');
    const warehouseName = searchParams.get('name');
    
    if (!warehouseId && !warehouseName) {
      return NextResponse.json(
        { success: false, error: 'Warehouse ID or name is required' },
        { status: 400 }
      );
    }

    // Find warehouse to deactivate
    const vendorId = currentUser.role === 'vendor' ? currentUser.id : 'admin';
    const warehouseQuery = currentUser.role === 'admin' 
      ? (warehouseId ? { _id: warehouseId } : { name: warehouseName })
      : (warehouseId ? { _id: warehouseId, vendorId: vendorId } : { name: warehouseName, vendorId: vendorId });

    const warehouse = await Warehouse.findOneAndUpdate(
      warehouseQuery,
      { 
        status: 'inactive',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Warehouse deactivated successfully',
      data: {
        warehouseId: warehouse._id,
        warehouseName: warehouse.name,
        status: warehouse.status,
        warehouse: {
          id: warehouse._id,
          name: warehouse.name,
          status: warehouse.status,
          isActive: warehouse.status === 'active',
          updatedAt: warehouse.updatedAt
        }
      }
    });

  } catch (error: any) {
    console.error('[Warehouse Update API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to deactivate warehouse'
    }, { status: 500 });
  }
}

// GET: Get warehouse details
export async function GET(request: NextRequest) {
  console.log('[Warehouse Update API] GET request received');
  
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
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('id');
    const warehouseName = searchParams.get('name');
    
    if (!warehouseId && !warehouseName) {
      return NextResponse.json(
        { success: false, error: 'Warehouse ID or name is required' },
        { status: 400 }
      );
    }

    // Find warehouse
    const vendorId = currentUser.role === 'vendor' ? currentUser.id : 'admin';
    const warehouseQuery = currentUser.role === 'admin' 
      ? (warehouseId ? { _id: warehouseId } : { name: warehouseName })
      : (warehouseId ? { _id: warehouseId, vendorId: vendorId } : { name: warehouseName, vendorId: vendorId });

    const warehouse = await Warehouse.findOne(warehouseQuery).lean();

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found or you do not have permission to view it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: warehouse._id.toString(),
        name: warehouse.name,
        registered_name: warehouse.registered_name,
        phone: warehouse.phone,
        email: warehouse.email,
        address: warehouse.address,
        city: warehouse.city,
        pin: warehouse.pin,
        state: warehouse.state,
        country: warehouse.country,
        return_address: warehouse.return_address,
        return_city: warehouse.return_city,
        return_pin: warehouse.return_pin,
        return_state: warehouse.return_state,
        return_country: warehouse.return_country,
        status: warehouse.status,
        isActive: warehouse.status === 'active',
        isDefault: warehouse.isDefault,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt
      }
    });

  } catch (error: any) {
    console.error('[Warehouse Update API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch warehouse details'
    }, { status: 500 });
  }
}
