import { NextRequest, NextResponse } from 'next/server';

/**
 * Delhivery Shipment Tracking API
 * Track shipments by waybill number or order ID
 */

interface TrackingResponse {
  waybill: string;
  status: string;
  scans: Array<{
    location: string;
    status: string;
    timestamp: string;
    description: string;
  }>;
  origin: string;
  destination: string;
  estimatedDelivery?: string;
  currentLocation?: string;
}

// Helper function to call Delhivery Tracking API
async function trackShipmentFromDelhivery(waybill: string): Promise<TrackingResponse> {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  const baseUrl = process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com';
  
  if (!token) {
    throw new Error('Delhivery auth token not configured');
  }

  // Use the configured base URL from environment variables
  const apiUrl = `${baseUrl}/api/v1/packages/json/`;

  console.log('[Tracking API] Tracking waybill:', waybill);

  const response = await fetch(`${apiUrl}?waybill=${waybill}`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Accept': 'application/json',
    }
  });

  console.log('[Tracking API] Delhivery response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Tracking API] Delhivery API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('[Tracking API] Delhivery response:', responseData);
  
  // Parse Delhivery tracking response
  const shipmentTrack = responseData.ShipmentTrack?.[0];
  if (!shipmentTrack) {
    throw new Error('No tracking information found');
  }

  // Convert to our format
  const trackingInfo: TrackingResponse = {
    waybill,
    status: shipmentTrack.Status?.Status || 'Unknown',
    scans: (shipmentTrack.Shipment?.Scans || []).map((scan: any) => ({
      location: scan.ScanDetail?.ScanDateTime?.split(' ')[0] || '',
      status: scan.ScanDetail?.Scan || '',
      timestamp: scan.ScanDetail?.ScanDateTime || '',
      description: scan.ScanDetail?.Instructions || scan.ScanDetail?.Scan || ''
    })),
    origin: shipmentTrack.Shipment?.Origin || '',
    destination: shipmentTrack.Shipment?.Destination || '',
    estimatedDelivery: shipmentTrack.Shipment?.ExpectedDeliveryDate || undefined,
    currentLocation: shipmentTrack.Shipment?.Scans?.[0]?.ScanDetail?.ScannedLocation || undefined
  };

  return trackingInfo;
}

// GET: Track shipment
export async function GET(request: NextRequest) {
  console.log('[Tracking API] GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const orderId = searchParams.get('orderId');

    if (!waybill && !orderId) {
      return NextResponse.json(
        { success: false, error: 'Waybill or Order ID is required' },
        { status: 400 }
      );
    }

    if (orderId && !waybill) {
      // If only order ID provided, we'd need to look up waybills from the order
      // For now, return error asking for waybill
      return NextResponse.json(
        { success: false, error: 'Waybill number is required for tracking. Order ID lookup not yet implemented.' },
        { status: 400 }
      );
    }

    let trackingInfo: TrackingResponse;

    try {
      trackingInfo = await trackShipmentFromDelhivery(waybill!);

    } catch (delhiveryError: any) {
      console.error('[Tracking API] Delhivery API Error:', delhiveryError);
      
      // For demo/development, create mock tracking info
      if (process.env.NODE_ENV === 'development') {
        console.log('[Tracking API] Creating demo tracking info...');
        
        trackingInfo = {
          waybill: waybill!,
          status: 'In Transit',
          scans: [
            {
              location: 'Mumbai Hub',
              status: 'Picked Up',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              description: 'Package picked up from origin'
            },
            {
              location: 'Delhi Hub',
              status: 'In Transit',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              description: 'Package in transit to destination'
            }
          ],
          origin: 'Mumbai',
          destination: 'Kolkata',
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currentLocation: 'Delhi Hub'
        };
      } else {
        return NextResponse.json({
          success: false,
          error: `Failed to track shipment: ${delhiveryError.message}`
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking information retrieved successfully',
      data: trackingInfo
    });

  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to track shipment'
    }, { status: 500 });
  }
}

// POST: Track multiple shipments
export async function POST(request: NextRequest) {
  console.log('[Tracking API] POST request received');
  
  try {
    const { waybills }: { waybills: string[] } = await request.json();

    if (!waybills || !Array.isArray(waybills) || waybills.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of waybill numbers is required' },
        { status: 400 }
      );
    }

    if (waybills.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 waybills can be tracked at once' },
        { status: 400 }
      );
    }

    const trackingResults: (TrackingResponse | { waybill: string; error: string })[] = [];

    // Track each waybill
    for (const waybill of waybills) {
      try {
        const trackingInfo = await trackShipmentFromDelhivery(waybill);
        trackingResults.push(trackingInfo);
      } catch (error: any) {
        // For demo mode, add mock data for failed tracking
        if (process.env.NODE_ENV === 'development') {
          trackingResults.push({
            waybill,
            status: 'In Transit',
            scans: [
              {
                location: 'Origin Hub',
                status: 'Picked Up',
                timestamp: new Date().toISOString(),
                description: 'Package picked up'
              }
            ],
            origin: 'Mumbai',
            destination: 'Kolkata',
            currentLocation: 'Origin Hub'
          });
        } else {
          trackingResults.push({
            waybill,
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tracking information for ${waybills.length} shipments`,
      data: {
        results: trackingResults,
        total: waybills.length,
        successful: trackingResults.filter(r => !('error' in r)).length,
        failed: trackingResults.filter(r => 'error' in r).length
      }
    });

  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to track shipments'
    }, { status: 500 });
  }
}
