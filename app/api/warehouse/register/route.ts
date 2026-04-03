import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple Warehouse Registration API for Delhivery
 * This endpoint registers a warehouse in the Delhivery system
 */

interface WarehouseRegistrationRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pin: string;
  state: string;
  country?: string;
}

async function registerWarehouseWithDelhivery(warehouseData: WarehouseRegistrationRequest) {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  
  if (!token) {
    throw new Error('Delhivery auth token not configured');
  }

  const registrationData = {
    name: warehouseData.name,
    registered_name: warehouseData.name,
    phone: warehouseData.phone,
    email: warehouseData.email,
    address: warehouseData.address,
    city: warehouseData.city,
    pin: warehouseData.pin,
    country: warehouseData.country || 'India',
    return_address: warehouseData.address,
    return_city: warehouseData.city,
    return_pin: warehouseData.pin,
    return_state: warehouseData.state,
    return_country: warehouseData.country || 'India'
  };

  // Try both staging and production APIs with different methods
  const urls = [
    { url: 'https://track.delhivery.com/api/backend/clientwarehouse/create/', method: 'POST' },
    { url: 'https://track.delhivery.com/api/backend/clientwarehouse/edit/', method: 'PUT' },
    { url: 'https://track.delhivery.com/api/backend/clientwarehouse/create/', method: 'POST' }
  ];

  let lastError;

  for (const { url: apiUrl, method } of urls) {
    console.log(`[Warehouse Registration] Trying ${method} ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      console.log(`[Warehouse Registration] Response status:`, response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('[Warehouse Registration] Success:', responseData);
        return responseData;
      } else {
        const errorText = await response.text();
        console.error(`[Warehouse Registration] API error (${method} ${apiUrl}):`, errorText);
        lastError = new Error(`${method} ${apiUrl} failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error(`[Warehouse Registration] Network error (${method} ${apiUrl}):`, error);
      lastError = error;
    }
  }

  throw lastError || new Error('All warehouse registration attempts failed');
}

export async function POST(request: NextRequest) {
  try {
    const body: WarehouseRegistrationRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.email || !body.address || !body.city || !body.pin || !body.state) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, phone, email, address, city, pin, state'
      }, { status: 400 });
    }

    // Register with Delhivery
    const result = await registerWarehouseWithDelhivery(body);

    return NextResponse.json({
      success: true,
      message: 'Warehouse registered successfully with Delhivery',
      data: result
    });

  } catch (error: any) {
    console.error('[Warehouse Registration] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to register warehouse'
    }, { status: 500 });
  }
}

// GET: Quick registration of default warehouse
export async function GET() {
  try {
    const defaultWarehouse = {
      name: 'Main Warehouse',
      phone: '9051617498',
      email: 'abworkhouse01@gmail.com',
      address: 'A11 577, Block A, Sector 1',
      city: 'Kalyani',
      pin: '741235',
      state: 'West Bengal',
      country: 'India'
    };

    console.log('[Warehouse Registration] Registering default warehouse...');
    const result = await registerWarehouseWithDelhivery(defaultWarehouse);

    return NextResponse.json({
      success: true,
      message: 'Default warehouse "Main Warehouse" registered successfully',
      data: result
    });

  } catch (error: any) {
    console.error('[Warehouse Registration] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to register default warehouse'
    }, { status: 500 });
  }
}
