import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';

// Helper function to call Delhivery Warehouse Update API
async function updateDelhiveryWarehouse(updateData: any) {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  if (!token) {
    throw new Error('Delhivery auth token not configured');
  }

  // Use correct URLs as per Delhivery documentation
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://track.delhivery.com/api/backend/clientwarehouse/edit/'
    : 'https://track.delhivery.com/api/backend/clientwarehouse/edit/'; // Use production URL always

  console.log('[Warehouse Update API] Updating warehouse with data:', JSON.stringify(updateData, null, 2));

  // Validate required fields based on Delhivery API requirements
  if (!updateData.name) {
    throw new Error('Warehouse name is required');
  }

  if (!updateData.pin) {
    throw new Error('PIN code is required');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updateData)
  });

  console.log('[Warehouse Update API] Delhivery response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Warehouse Update API] Delhivery API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    
    // If it's a 401 error, the token might be invalid or the warehouse doesn't exist
    if (response.status === 401) {
      throw new Error(`Authentication failed. The warehouse "${updateData.name}" might not exist in your Delhivery account, or your API token is invalid.`);
    }
    
    throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('[Warehouse Update API] Delhivery response:', responseData);
  return responseData;
}

// PUT: Update warehouse
export async function PUT(request: NextRequest) {
  console.log('[Warehouse Update API] PUT request received');
  
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins and verified vendors can update warehouses
    if (currentUser.role !== 'admin' && (currentUser.role !== 'vendor' || !currentUser.verified)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admins and verified vendors can update warehouses.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    console.log('[Warehouse Update API] Request body:', body);

    // Validate required parameters
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Warehouse name is required' },
        { status: 400 }
      );
    }

    if (!body.pin) {
      return NextResponse.json(
        { success: false, error: 'PIN code is required' },
        { status: 400 }
      );
    }

    // For vendors, use their own ID. For admins, they can manage all warehouses
    const vendorId = currentUser.role === 'vendor' ? currentUser.id : 'admin';

    // Find existing warehouse in MongoDB (scoped to vendor if not admin)
    const warehouseQuery = currentUser.role === 'admin' 
      ? { name: body.name, status: 'active' }
      : { name: body.name, vendorId: vendorId, status: 'active' };
    
    const existingWarehouse = await Warehouse.findOne(warehouseQuery);

    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Create update payload for Delhivery (only include fields that have values)
    const delhiveryUpdatePayload: any = {
      name: body.name,
      pin: body.pin
    };

    if (body.address) delhiveryUpdatePayload.address = body.address;
    if (body.phone) delhiveryUpdatePayload.phone = body.phone;

    // Call Delhivery API
    try {
      const delhiveryResponse = await updateDelhiveryWarehouse(delhiveryUpdatePayload);

      // Check if Delhivery response is successful
      if (delhiveryResponse.success !== false) {
        // Update warehouse in MongoDB
        const updateFields: any = {};
        if (body.address) updateFields.address = body.address;
        if (body.pin) updateFields.pin = body.pin;
        if (body.phone) updateFields.phone = body.phone;
        updateFields.updatedAt = new Date();

        const updatedWarehouse = await Warehouse.findByIdAndUpdate(
          existingWarehouse._id,
          updateFields,
          { new: true }
        );

        return NextResponse.json({
          success: true,
          message: 'Warehouse updated successfully',
          data: {
            warehouseId: updatedWarehouse?._id,
            warehouseName: updatedWarehouse?.name,
            delhiveryResponse,
            warehouse: {
              id: updatedWarehouse?._id,
              name: updatedWarehouse?.name,
              phone: updatedWarehouse?.phone,
              email: updatedWarehouse?.email,
              address: updatedWarehouse?.address,
              city: updatedWarehouse?.city,
              pin: updatedWarehouse?.pin,
              country: updatedWarehouse?.country,
              return_address: updatedWarehouse?.return_address,
              status: updatedWarehouse?.status,
              isActive: updatedWarehouse?.status === 'active',
              createdAt: updatedWarehouse?.createdAt,
              updatedAt: updatedWarehouse?.updatedAt
            }
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Delhivery API error: ${delhiveryResponse.message || 'Failed to update warehouse'}`
        }, { status: 400 });
      }
    } catch (delhiveryError: any) {
      console.error('[Warehouse Update API] Delhivery API Error:', delhiveryError);
      
      // For demo purposes, create a mock successful response
      if (process.env.NODE_ENV === 'development') {
        console.log('[Warehouse Update API] Creating demo update response due to API error...');
        const mockSuccessResponse = {
          success: true,
          message: 'Demo warehouse updated successfully',
          warehouse_name: body.name,
          error: delhiveryError.message
        };

        // Update warehouse in MongoDB even for demo
        const updateFields: any = {};
        if (body.address) updateFields.address = body.address;
        if (body.pin) updateFields.pin = body.pin;
        if (body.phone) updateFields.phone = body.phone;
        updateFields.updatedAt = new Date();

        const updatedWarehouse = await Warehouse.findByIdAndUpdate(
          existingWarehouse._id,
          updateFields,
          { new: true }
        );

        return NextResponse.json({
          success: true,
          message: 'Demo warehouse updated successfully (Delhivery API integration issue)',
          data: {
            warehouseId: updatedWarehouse?._id,
            warehouseName: updatedWarehouse?.name,
            delhiveryResponse: mockSuccessResponse,
            warehouse: {
              id: updatedWarehouse?._id,
              name: updatedWarehouse?.name,
              phone: updatedWarehouse?.phone,
              email: updatedWarehouse?.email,
              address: updatedWarehouse?.address,
              city: updatedWarehouse?.city,
              pin: updatedWarehouse?.pin,
              country: updatedWarehouse?.country,
              return_address: updatedWarehouse?.return_address,
              status: updatedWarehouse?.status,
              isActive: updatedWarehouse?.status === 'active',
              createdAt: updatedWarehouse?.createdAt,
              updatedAt: updatedWarehouse?.updatedAt
            }
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: `Failed to update warehouse: ${delhiveryError.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Warehouse Update API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update warehouse'
    }, { status: 500 });
  }
}

// POST: Alternative method for updating warehouse
export async function POST(request: NextRequest) {
  return PUT(request);
}
