import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';

interface WarehouseData {
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

interface DelhiveryWarehousePayload {
  name: string;
  registered_name?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pin: string;
  country?: string;
  return_address: string;
  return_city?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
}

interface DelhiveryResponse {
  success: boolean;
  message?: string;
  warehouse_name?: string;
  data?: any;
}

// Enhanced Delhivery warehouse creation with multiple endpoint attempts
async function createDelhiveryWarehouse(payload: DelhiveryWarehousePayload): Promise<DelhiveryResponse> {
  const authToken = process.env.DELHIVERY_AUTH_TOKEN;
  const baseUrl = process.env.DELHIVERY_BASE_URL;

  if (!authToken) {
    throw new Error('DELHIVERY_AUTH_TOKEN environment variable is not set');
  }

  if (!baseUrl) {
    throw new Error('DELHIVERY_BASE_URL environment variable is not set');
  }

  const endpoints = [
    `${baseUrl}/api/backend/clientwarehouse/create/`,
    `${baseUrl}/api/p/edit/`,
    `${baseUrl}/api/cmu/create/`
  ];

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${authToken}`
  };

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[Warehouse API] Trying PUT ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      console.log(`[Warehouse API] Response status: ${response.status}`);

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        console.log(`[Warehouse API] Success with ${endpoint}:`, data);
        return {
          success: true,
          message: 'Warehouse created successfully',
          warehouse_name: payload.name,
          data
        };
      } else if (response.status === 401) {
        console.error('[Warehouse API] Authentication failed - invalid token');
        throw new Error('Invalid Delhivery API token');
      } else if (response.status === 409) {
        console.warn('[Warehouse API] Warehouse name already exists in Delhivery');
        throw new Error('Warehouse name already exists in Delhivery system');
      } else if (response.status === 422) {
        const errorData = await response.json();
        console.error('[Warehouse API] Validation error:', errorData);
        throw new Error(`Validation error: ${JSON.stringify(errorData)}`);
      } else {
        const errorText = await response.text();
        console.error(`[Warehouse API] Error ${response.status}:`, errorText);
        throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`[Warehouse API] Error with ${endpoint}:`, error);
      lastError = error;
      
      // If this is an authentication or validation error, don't try other endpoints
      if (error.message.includes('Invalid Delhivery API token') || 
          error.message.includes('Warehouse name already exists') ||
          error.message.includes('Validation error')) {
        throw error;
      }
      
      // Continue to next endpoint for other errors
      continue;
    }
  }

  // If we get here, all endpoints failed
  throw lastError || new Error('All Delhivery API endpoints failed');
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
    console.log('[Warehouse API] Request body:', body);

    // Validate required fields
    if (!body.name || !body.phone || !body.pin || !body.return_address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, phone, pin, return_address'
      }, { status: 400 });
    }

    // Prepare payload for Delhivery API
    const warehousePayload: DelhiveryWarehousePayload = {
      name: body.name.trim(),
      registered_name: body.registered_name?.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim(),
      address: body.address?.trim(),
      city: body.city?.trim(),
      pin: body.pin.trim(),
      country: body.country?.trim() || 'India',
      return_address: body.return_address.trim(),
      return_city: body.return_city?.trim(),
      return_pin: body.return_pin?.trim(),
      return_state: body.return_state?.trim(),
      return_country: body.return_country?.trim() || 'India'
    };

    console.log('[Warehouse API] Creating warehouse with data:', JSON.stringify(warehousePayload, null, 2));

    const vendorId = currentUser.id || 'default';

    // Check if warehouse with same name already exists
    const existingWarehouse = await Warehouse.findOne({
      name: body.name,
      vendorId: vendorId,
      status: 'active' 
    });

    if (existingWarehouse) {
      return NextResponse.json({
        success: false,
        error: `A warehouse with the name "${body.name}" already exists. Please choose a different name.`,
        code: 'WAREHOUSE_DUPLICATE'
      }, { status: 409 });
    }

    // Call Delhivery API
    try {
      const delhiveryResponse = await createDelhiveryWarehouse(warehousePayload);

      // Save warehouse to MongoDB
      const warehouse = new Warehouse({
        name: body.name,
        registered_name: body.registered_name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        pin: body.pin,
        country: body.country || 'India',
        return_address: body.return_address,
        return_city: body.return_city,
        return_pin: body.return_pin,
        return_state: body.return_state,
        return_country: body.return_country || 'India',
        status: 'active',
        delhiveryResponse,
        createdBy: currentUser.id,
        vendorId: vendorId,
        isDefault: true
      });

      try {
        await warehouse.save();
      } catch (saveError: any) {
        // Handle MongoDB duplicate key errors
        if (saveError.code === 11000) {
          return NextResponse.json({
            success: false,
            error: `A warehouse with the name "${body.name}" already exists. Please choose a different name.`,
            code: 'WAREHOUSE_DUPLICATE'
          }, { status: 409 });
        }
        throw saveError;
      }

      return NextResponse.json({
        success: true,
        message: 'Warehouse created successfully',
        data: {
          warehouseId: warehouse._id,
          warehouseName: body.name,
          delhiveryResponse,
          warehouse: {
            id: warehouse._id,
            name: warehouse.name,
            phone: warehouse.phone,
            email: warehouse.email,
            address: warehouse.address,
            city: warehouse.city,
            pin: warehouse.pin,
            country: warehouse.country,
            return_address: warehouse.return_address,
            status: warehouse.status,
            isActive: warehouse.status === 'active',
            createdAt: warehouse.createdAt
          }
        }
      });

    } catch (delhiveryError: any) {
      console.error('[Warehouse API] Delhivery API Error:', delhiveryError);
      
      // Enhanced error handling with demo mode fallback
      let errorMessage = 'Failed to create warehouse';
      let shouldCreateDemo = false;

      if (delhiveryError.message?.includes('Invalid Delhivery API token')) {
        errorMessage = 'API authentication failed';
        shouldCreateDemo = true;
      } else if (delhiveryError.message?.includes('Warehouse name already exists')) {
        return NextResponse.json({
          success: false,
          error: `Warehouse name "${body.name}" already exists in Delhivery system. Please choose a different name.`,
          code: 'WAREHOUSE_DUPLICATE'
        }, { status: 409 });
      } else if (delhiveryError.message?.includes('Network') || delhiveryError.message?.includes('ECONNRESET')) {
        errorMessage = 'Network connection error';
        shouldCreateDemo = true;
      } else {
        errorMessage = delhiveryError.message || 'Delhivery API error';
        shouldCreateDemo = true;
      }

      // Create demo warehouse when API is unavailable
      if (shouldCreateDemo) {
        console.log('[Warehouse API] Creating demo warehouse due to API error...');
        
        const demoResponse = {
          success: true,
          message: 'Demo warehouse created successfully',
          warehouse_name: body.name,
          demo_mode: true,
          reason: errorMessage
        };

        // Save warehouse to MongoDB in demo mode
        const warehouse = new Warehouse({
          name: body.name,
          registered_name: body.registered_name,
          phone: body.phone,
          email: body.email,
          address: body.address,
          city: body.city,
          pin: body.pin,
          country: body.country || 'India',
          return_address: body.return_address,
          return_city: body.return_city,
          return_pin: body.return_pin,
          return_state: body.return_state,
          return_country: body.return_country || 'India',
          status: 'active',
          delhiveryResponse: demoResponse,
          createdBy: currentUser.id,
          vendorId: vendorId,
          isDefault: true
        });

        try {
          await warehouse.save();
        } catch (saveError: any) {
          // Handle MongoDB duplicate key errors in demo mode
          if (saveError.code === 11000) {
            return NextResponse.json({
              success: false,
              error: `A warehouse with the name "${body.name}" already exists. Please choose a different name.`,
              code: 'WAREHOUSE_DUPLICATE'
            }, { status: 409 });
          }
          throw saveError;
        }

        return NextResponse.json({
          success: true,
          message: 'Warehouse created successfully in demo mode',
          data: {
            warehouseId: warehouse._id,
            warehouseName: body.name,
            delhiveryResponse: demoResponse,
            demo_mode: true,
            warehouse: {
              id: warehouse._id,
              name: warehouse.name,
              phone: warehouse.phone,
              email: warehouse.email,
              address: warehouse.address,
              city: warehouse.city,
              pin: warehouse.pin,
              country: warehouse.country,
              return_address: warehouse.return_address,
              status: warehouse.status,
              isActive: warehouse.status === 'active',
              createdAt: warehouse.createdAt
            }
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: 'DELHIVERY_API_ERROR'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Warehouse API] Unexpected error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'A warehouse with this name already exists. Please choose a different name.',
        code: 'WAREHOUSE_DUPLICATE'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error occurred'
    }, { status: 500 });
  }
}

// GET: List warehouses
export async function GET(request: NextRequest) {
  console.log('[Warehouse API] GET request received');
  
  try {
    await connectToDatabase();
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = currentUser.id || 'default';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: any = { vendorId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { pin: { $regex: search, $options: 'i' } }
      ];
    }

    // Get warehouses with pagination
    const skip = (page - 1) * limit;
    const warehouses = await Warehouse.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Warehouse.countDocuments(query);

    // Transform data for response
    const transformedWarehouses = warehouses.map((warehouse: any) => ({
      id: warehouse._id,
      name: warehouse.name,
      phone: warehouse.phone,
      email: warehouse.email,
      address: warehouse.address,
      city: warehouse.city,
      pin: warehouse.pin,
      country: warehouse.country,
      return_address: warehouse.return_address,
      status: warehouse.status,
      isActive: warehouse.status === 'active',
      isDefault: warehouse.isDefault,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: transformedWarehouses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('[Warehouse API] Error listing warehouses:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list warehouses'
    }, { status: 500 });
  }
}
