import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';
import { DelhiveryAPI } from '@/lib/shipment/delhivery-api';

const delhivery = new DelhiveryAPI();

interface WarehouseData {
  id?: string;
  name: string;
  registered_name?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pin: string;
  state?: string;
  country?: string;
  return_address: string;
  return_city?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
}

// POST: Create a warehouse
export async function POST(request: NextRequest) {
  console.log('[Warehouse API] POST request received');

  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: WarehouseData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.pin || !body.return_address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, phone, pin, return_address'
      }, { status: 400 });
    }

    const vendorId = currentUser.id || 'default';

    // Check if warehouse already exists locally
    const existingWarehouse = await Warehouse.findOne({
      name: body.name,
      vendorId: vendorId,
      status: 'active' 
    });

    if (existingWarehouse) {
      return NextResponse.json({
        success: false,
        error: `A warehouse with the name "${body.name}" already exists.`,
        code: 'WAREHOUSE_DUPLICATE'
      }, { status: 409 });
    }

    // Call Delhivery API to create warehouse
    const payload = {
      name: body.name.trim(),
      registered_name: body.registered_name?.trim(),
      phone: body.phone.trim(),
      address: body.address?.trim(),
      city: body.city?.trim(),
      pin: body.pin.trim(),
      country: body.country?.trim() || 'India',
      return_address: body.return_address.trim(),
      return_city: body.return_city?.trim(),
      return_pin: body.return_pin?.trim() || body.pin.trim(),
      return_state: body.return_state?.trim(),
      return_country: body.return_country?.trim() || 'India'
    };

    try {
      // Use the correct Delhivery API endpoint for warehouse creation
      const apiUrl = `${process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com'}/api/backend/clientwarehouse/create/`;
      const createResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Delhivery API error: ${createResponse.status} - ${errorText}`);
      }

      const delhiveryData = await createResponse.json();

      // Save to MongoDB
      const warehouse = new Warehouse({
        ...body,
        status: 'active',
        vendorId,
        createdBy: currentUser.id,
        delhiveryResponse: delhiveryData,
        isDefault: true // Set as default for now
      });

      await warehouse.save();

      return NextResponse.json({
        success: true,
        message: 'Warehouse created successfully',
        data: warehouse
      });

    } catch (delhiveryError: any) {
      console.error('[Warehouse API] Delhivery API Error:', delhiveryError);
      return NextResponse.json({
        success: false,
        error: delhiveryError.message || 'Failed to create warehouse in Delhivery'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Warehouse API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// PATCH: Update a warehouse
export async function PATCH(request: NextRequest) {
  console.log('[Warehouse API] PATCH request received');

  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: WarehouseData = await request.json();
    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, error: 'Warehouse ID and name are required' }, { status: 400 });
    }

    const warehouse = await Warehouse.findById(body.id);
    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    // Call Delhivery API to update warehouse
    const payload = {
      name: body.name, // Name cannot be changed in Delhivery
      address: body.address,
      phone: body.phone,
      pin: body.pin,
      return_address: body.return_address
    };

    try {
      const delhiveryResponse = await delhivery.updateWarehouse(payload);

      // Update local storage
      Object.assign(warehouse, body);
      warehouse.delhiveryResponse = delhiveryResponse;
      await warehouse.save();

      return NextResponse.json({
        success: true,
        message: 'Warehouse updated successfully',
        data: warehouse
      });

    } catch (delhiveryError: any) {
      console.error('[Warehouse API] Delhivery Update Error:', delhiveryError);
      return NextResponse.json({
        success: false,
        error: delhiveryError.message || 'Failed to update warehouse in Delhivery'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Warehouse API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// GET: List warehouses
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: any = { status: 'active' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const warehouses = await Warehouse.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: warehouses.map((w: any) => ({
        id: w._id,
        name: w.name,
        phone: w.phone,
        email: w.email,
        address: w.address,
        city: w.city,
        pin: w.pin,
        country: w.country,
        return_address: w.return_address,
        status: w.status,
        isActive: w.status === 'active',
        isDefault: w.isDefault,
        createdAt: w.createdAt
      }))
    });

  } catch (error: any) {
    console.error('[Warehouse API] Error listing warehouses:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list warehouses'
    }, { status: 500 });
  }
}

// DELETE: Deactivate a warehouse
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Warehouse ID is required' }, { status: 400 });
    }

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    // Soft delete by setting status to inactive
    warehouse.status = 'inactive';
    await warehouse.save();

    return NextResponse.json({
      success: true,
      message: 'Warehouse deactivated successfully'
    });

  } catch (error: any) {
    console.error('[Warehouse API] Error deactivating warehouse:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
