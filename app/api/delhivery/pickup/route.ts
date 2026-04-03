import { NextRequest, NextResponse } from 'next/server';

/**
 * Delhivery Pickup Request Creation API
 * Creates a pickup request for shipments ready for collection
 */

interface PickupRequestData {
  pickup_time: string;     // Time for the pickup (hh:mm:ss)
  pickup_date: string;     // Date for the pickup (YYYY-MM-DD)
  pickup_location: string; // Registered client warehouse
  expected_package_count: number; // Count of packages to be picked up
}

export async function POST(request: NextRequest) {
  try {
    const data: PickupRequestData = await request.json();
    
    // Validate required fields
    if (!data.pickup_time || !data.pickup_date || !data.pickup_location || !data.expected_package_count) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: pickup_time, pickup_date, pickup_location, expected_package_count'
      }, { status: 400 });
    }

    // Get Delhivery API credentials from environment
    const delhiveryToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN;
    
    if (!delhiveryToken) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API token not configured'
      }, { status: 500 });
    }

    // Use production URL only
    const baseUrl = 'https://track.delhivery.com';

    console.log('[Delhivery Pickup API] Creating pickup request for:', data);
    console.log('[Delhivery Pickup API] Using production URL:', baseUrl);

    console.log('[Delhivery Pickup API] Creating pickup request:', data);

    // Make request to Delhivery API
    const response = await fetch(`${baseUrl}/fm/request/new/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${delhiveryToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup_time: data.pickup_time,
        pickup_date: data.pickup_date,
        pickup_location: data.pickup_location,
        expected_package_count: data.expected_package_count
      })
    });

    const responseText = await response.text();
    console.log('[Delhivery Pickup API] Response:', responseText);

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.status} - ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Delhivery Pickup API] JSON parse error:', parseError);
      throw new Error('Invalid response format from Delhivery API');
    }

    console.log('[Delhivery Pickup API] Pickup request created successfully');

    return NextResponse.json({
      success: true,
      message: 'Pickup request created successfully',
      data: result
    });

  } catch (error: any) {
    console.error('[Delhivery Pickup API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create pickup request'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to create pickup requests.'
  }, { status: 405 });
}
