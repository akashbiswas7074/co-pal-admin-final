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

// Validate Delhivery production token
async function validateDelhiveryToken(authToken: string, productionUrl: string): Promise<boolean> {
  try {
    console.log('[Warehouse API] Validating production token...');
    
    const response = await fetch(`${productionUrl}/api/kinko/v1/invoice/charges/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${authToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`[Warehouse API] Token validation response: ${response.status}`);
    
    // 200 or 400 (bad request) means token is valid, 401 means invalid
    return response.status !== 401;
  } catch (error) {
    console.error('[Warehouse API] Token validation failed:', error);
    return false;
  }
}

// Production-only Delhivery warehouse creation
async function createDelhiveryWarehouse(payload: DelhiveryWarehousePayload): Promise<DelhiveryResponse> {
  const authToken = process.env.DELHIVERY_AUTH_TOKEN;
  const productionUrl = process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com';

  if (!authToken) {
    throw new Error('DELHIVERY_AUTH_TOKEN environment variable is not set');
  }

  console.log(`[Warehouse API] Using production URL: ${productionUrl}`);

  // Validate the production token before making API calls
  const isTokenValid = await validateDelhiveryToken(authToken, productionUrl);
  if (!isTokenValid) {
    console.error('[Warehouse API] Production token validation failed');
    throw new Error('Invalid Delhivery production token - please verify your credentials');
  }

  // Production-only endpoints with different methods for better compatibility
  const endpoints = [
    { url: `${productionUrl}/api/backend/clientwarehouse/create/`, method: 'PUT' },
    { url: `${productionUrl}/api/p/edit/`, method: 'PUT' },
    { url: `${productionUrl}/api/cmu/create/`, method: 'POST' },
    { url: `${productionUrl}/api/backend/clientwarehouse/edit/`, method: 'POST' }
  ];

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${authToken}`,
    'Accept': 'application/json'
  };

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[Warehouse API] Trying ${endpoint.method} ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers,
        body: JSON.stringify(payload)
      });

      console.log(`[Warehouse API] Response status: ${response.status}`);
      console.log(`[Warehouse API] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (response.status === 200 || response.status === 201) {
        try {
          const data = await response.json();
          console.log(`[Warehouse API] Success with ${endpoint.url}:`, data);
          return {
            success: true,
            message: 'Warehouse created successfully in production',
            warehouse_name: payload.name,
            data
          };
        } catch (jsonError) {
          // If JSON parsing fails, try as text
          const textData = await response.text();
          console.log(`[Warehouse API] Success response as text:`, textData);
          return {
            success: true,
            message: 'Warehouse created successfully in production',
            warehouse_name: payload.name,
            data: { response: textData }
          };
        }
      } else if (response.status === 401) {
        console.error('[Warehouse API] Authentication failed - invalid token');
        throw new Error('Invalid Delhivery API token - please check your production credentials');
      } else if (response.status === 409) {
        console.warn('[Warehouse API] Warehouse name already exists in Delhivery');
        throw new Error('Warehouse name already exists in Delhivery system');
      } else if (response.status === 422) {
        try {
          const errorData = await response.json();
          console.error('[Warehouse API] Validation error:', errorData);
          throw new Error(`Validation error: ${JSON.stringify(errorData)}`);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('[Warehouse API] Validation error (text):', errorText);
          throw new Error(`Validation error: ${errorText}`);
        }
      } else {
        // Enhanced error handling for other status codes
        try {
          const errorData = await response.json();
          console.error(`[Warehouse API] Error ${response.status} (JSON):`, errorData);
          
          // Check if it's a specific Delhivery error format
          if (errorData.message) {
            throw new Error(`Delhivery API error: ${errorData.message}`);
          } else if (errorData.error) {
            throw new Error(`Delhivery API error: ${errorData.error}`);
          } else {
            throw new Error(`Delhivery API error: ${response.status} - ${JSON.stringify(errorData)}`);
          }
        } catch (jsonError) {
          // If JSON parsing fails, get as text
          const errorText = await response.text();
          console.error(`[Warehouse API] Error ${response.status} (text):`, errorText);
          
          // Check for specific error patterns in text response
          if (errorText.includes('invalid token') || errorText.includes('unauthorized')) {
            throw new Error('Invalid Delhivery API token - please check your production credentials');
          } else if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            throw new Error('Warehouse name already exists in Delhivery system');
          } else {
            throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
          }
        }
      }
    } catch (error: any) {
      console.error(`[Warehouse API] Error with ${endpoint.url}:`, error);
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
  throw lastError || new Error('All Delhivery production API endpoints failed');
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

    // Call Delhivery Production API
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
        message: 'Warehouse created successfully in production',
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
      console.error('[Warehouse API] Delhivery Production API Error:', delhiveryError);
      
      // Production-only error handling - no demo mode fallback
      let errorMessage = 'Failed to create warehouse in production';
      let statusCode = 500;

      if (delhiveryError.message?.includes('Invalid Delhivery production token')) {
        errorMessage = 'Production API authentication failed. Please verify your Delhivery production credentials.';
        statusCode = 401;
      } else if (delhiveryError.message?.includes('Warehouse name already exists')) {
        return NextResponse.json({
          success: false,
          error: `Warehouse name "${body.name}" already exists in Delhivery production system. Please choose a different name.`,
          code: 'WAREHOUSE_DUPLICATE'
        }, { status: 409 });
      } else if (delhiveryError.message?.includes('Network') || delhiveryError.message?.includes('ECONNRESET')) {
        errorMessage = 'Network connection error with Delhivery production servers. Please try again later.';
        statusCode = 503;
      } else if (delhiveryError.message?.includes('Validation error')) {
        errorMessage = `Production API validation error: ${delhiveryError.message}`;
        statusCode = 422;
      } else {
        errorMessage = delhiveryError.message || 'Delhivery production API error';
        statusCode = 500;
      }

      // Return error - no demo mode in production
      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: 'PRODUCTION_API_ERROR',
        message: 'Warehouse creation failed. Please check your production configuration and try again.'
      }, { status: statusCode });
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
