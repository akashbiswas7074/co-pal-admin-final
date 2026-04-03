import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';
import { getCurrentUser } from '@/lib/auth';

/**
 * Enhanced Delhivery Client Warehouse Management API
 * Supports both creation and update with improved error handling and MongoDB synchronization
 */

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

// Enhanced Delhivery API handler with better error handling
async function callDelhiveryAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT',
  data?: any,
  retries = 3
): Promise<DelhiveryResponse> {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  
  if (!token) {
    console.warn('[Warehouse API] DELHIVERY_AUTH_TOKEN not configured');
    return { success: false, message: 'API token not configured' };
  }

  const baseURLs = [
    'https://staging-express.delhivery.com',
    'https://track.delhivery.com'
  ];

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const baseURL of baseURLs) {
      try {
        const url = `${baseURL}${endpoint}`;
        console.log(`[Warehouse API] Attempt ${attempt + 1}: ${method} ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log(`[Warehouse API] Response status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log('[Warehouse API] Success:', responseData);
          return {
            success: true,
            data: responseData,
            message: responseData.message || 'Operation successful'
          };
        } else if (response.status === 401) {
          console.error('[Warehouse API] Authentication failed - invalid token');
          return { success: false, message: 'Invalid API token' };
        } else if (response.status === 429) {
          console.warn('[Warehouse API] Rate limit exceeded, retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          continue;
        } else {
          const errorText = await response.text();
          console.error(`[Warehouse API] API error (${response.status}):`, errorText);
          
          if (attempt === retries - 1) {
            return { 
              success: false, 
              message: `API error: ${response.status} - ${errorText}` 
            };
          }
        }
      } catch (error: any) {
        console.error(`[Warehouse API] Network error:`, error);
        
        if (attempt === retries - 1) {
          return { 
            success: false, 
            message: `Network error: ${error.message}` 
          };
        }
      }
    }
  }

  return { success: false, message: 'All API attempts failed' };
}

// Enhanced warehouse validation
function validateWarehouseData(data: WarehouseData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Warehouse name is required');
  } else if (data.name.length > 100) {
    errors.push('Warehouse name must be less than 100 characters');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(data.phone)) {
    errors.push('Please provide a valid phone number');
  }

  if (!data.pin?.trim()) {
    errors.push('Pincode is required');
  } else if (!/^\d{6}$/.test(data.pin)) {
    errors.push('Please provide a valid 6-digit pincode');
  }

  if (!data.return_address?.trim()) {
    errors.push('Return address is required');
  } else if (data.return_address.length > 500) {
    errors.push('Return address must be less than 500 characters');
  }

  if (data.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  return { isValid: errors.length === 0, errors };
}

// POST: Create warehouse
export async function POST(request: NextRequest) {
  console.log('[Warehouse API] POST request received');
  
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
        { success: false, error: 'Insufficient permissions. Only admins and verified vendors can create warehouses.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body: WarehouseData = await request.json();
    console.log('[Warehouse API] Request body:', body);

    // Validate input data
    const validation = validateWarehouseData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Check for duplicate warehouse names
    const vendorId = currentUser.role === 'vendor' ? currentUser.id : 'admin';
    const existingWarehouse = await Warehouse.findOne({ 
      name: body.name, 
      vendorId,
      status: { $ne: 'inactive' }
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { 
          success: false, 
          error: `A warehouse with the name "${body.name}" already exists. Please choose a different name.`,
          code: 'WAREHOUSE_DUPLICATE' 
        },
        { status: 409 }
      );
    }

    // Prepare Delhivery payload
    const delhiveryPayload: DelhiveryWarehousePayload = {
      name: body.name,
      phone: body.phone,
      pin: body.pin,
      return_address: body.return_address,
      country: body.country || 'India',
      return_country: body.return_country || 'India'
    };

    // Add optional fields if provided
    if (body.registered_name) delhiveryPayload.registered_name = body.registered_name;
    if (body.email) delhiveryPayload.email = body.email;
    if (body.address) delhiveryPayload.address = body.address;
    if (body.city) delhiveryPayload.city = body.city;
    if (body.return_city) delhiveryPayload.return_city = body.return_city;
    if (body.return_pin) delhiveryPayload.return_pin = body.return_pin;
    if (body.return_state) delhiveryPayload.return_state = body.return_state;

    // Try to create warehouse with Delhivery
    const delhiveryResponse = await callDelhiveryAPI(
      '/api/backend/clientwarehouse/create/',
      'PUT',
      delhiveryPayload
    );

    // Create warehouse document
    const warehouseDoc = new Warehouse({
      name: body.name,
      registered_name: body.registered_name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      city: body.city,
      pin: body.pin,
      state: body.state,
      country: body.country || 'India',
      return_address: body.return_address,
      return_city: body.return_city,
      return_pin: body.return_pin,
      return_state: body.return_state,
      return_country: body.return_country || 'India',
      status: delhiveryResponse.success ? 'active' : 'pending',
      delhiveryResponse: delhiveryResponse.data,
      createdBy: currentUser.id,
      vendorId: vendorId,
      isDefault: false
    });

    try {
      await warehouseDoc.save();
      console.log('[Warehouse API] Warehouse saved to MongoDB');
    } catch (saveError: any) {
      console.error('[Warehouse API] MongoDB save error:', saveError);
      
      if (saveError.code === 11000) {
        return NextResponse.json({
          success: false,
          error: `A warehouse with the name "${body.name}" already exists. Please choose a different name.`,
          code: 'WAREHOUSE_DUPLICATE'
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to save warehouse to database'
      }, { status: 500 });
    }

    // Determine response based on Delhivery API result
    if (delhiveryResponse.success) {
      return NextResponse.json({
        success: true,
        message: 'Warehouse created successfully and registered with Delhivery',
        data: {
          warehouseId: warehouseDoc._id,
          warehouseName: body.name,
          delhiveryResponse: delhiveryResponse.data,
          status: 'active',
          warehouse: {
            id: warehouseDoc._id,
            name: warehouseDoc.name,
            phone: warehouseDoc.phone,
            email: warehouseDoc.email,
            address: warehouseDoc.address,
            city: warehouseDoc.city,
            pin: warehouseDoc.pin,
            country: warehouseDoc.country,
            return_address: warehouseDoc.return_address,
            status: warehouseDoc.status,
            isActive: warehouseDoc.status === 'active',
            createdAt: warehouseDoc.createdAt
          }
        }
      });
    } else {
      // Warehouse saved but Delhivery registration failed
      return NextResponse.json({
        success: true,
        message: `Warehouse created locally but Delhivery registration ${delhiveryResponse.message}. Contact support to complete registration.`,
        data: {
          warehouseId: warehouseDoc._id,
          warehouseName: body.name,
          status: 'pending',
          delhiveryError: delhiveryResponse.message,
          warehouse: {
            id: warehouseDoc._id,
            name: warehouseDoc.name,
            phone: warehouseDoc.phone,
            email: warehouseDoc.email,
            address: warehouseDoc.address,
            city: warehouseDoc.city,
            pin: warehouseDoc.pin,
            country: warehouseDoc.country,
            return_address: warehouseDoc.return_address,
            status: warehouseDoc.status,
            isActive: warehouseDoc.status === 'active',
            createdAt: warehouseDoc.createdAt
          }
        }
      });
    }

  } catch (error: any) {
    console.error('[Warehouse API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// GET: List warehouses
export async function GET(request: NextRequest) {
  console.log('[Warehouse API] GET request received');
  
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'active';
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query: any = { status };
    if (currentUser.role === 'vendor') {
      query.vendorId = currentUser.id;
    } else if (currentUser.role === 'admin') {
      // Admin can see all warehouses
      const vendorId = searchParams.get('vendorId');
      if (vendorId) {
        query.vendorId = vendorId;
      }
    }

    // Fetch warehouses with pagination
    const [warehouses, totalCount] = await Promise.all([
      Warehouse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-delhiveryResponse') // Exclude large response data
        .lean(),
      Warehouse.countDocuments(query)
    ]);

    // Transform data for frontend
    const transformedWarehouses = warehouses.map((warehouse: any) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: transformedWarehouses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('[Warehouse API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch warehouses'
    }, { status: 500 });
  }
}
