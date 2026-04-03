import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

/**
 * Modern Shipment Tracking API
 * Track shipments by waybill number using service layer
 */

// GET: Track single shipment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');

    if (!waybill) {
      return NextResponse.json({
        success: false,
        error: 'waybill parameter is required'
      }, { status: 400 });
    }

    console.log('[Tracking API] Tracking shipment:', waybill);

    const trackingInfo = await shipmentService.trackShipment(waybill);
    
    if (!trackingInfo) {
      return NextResponse.json({
        success: false,
        error: 'No tracking information found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
  try {
    const body = await request.json();
    const { waybills, waybillNumber } = body;

    // Support both single waybill and array of waybills
    const waybillList = waybillNumber ? [waybillNumber] : waybills;

    if (!waybillList || !Array.isArray(waybillList)) {
      return NextResponse.json({
        success: false,
        error: 'waybills array or waybillNumber is required'
      }, { status: 400 });
    }

    console.log('[Tracking API] Tracking shipments:', waybillList.length);

    const trackingResults = await Promise.all(
      waybillList.map(async (waybill: string) => {
        try {
          const trackingInfo = await shipmentService.trackShipment(waybill);
          return {
            waybill,
            success: true,
            data: trackingInfo
          };
        } catch (error: any) {
          return {
            waybill,
            success: false,
            error: error.message
          };
        }
      })
    );

    // If single waybill, return the tracking info directly
    if (waybillNumber && trackingResults.length === 1) {
      const result = trackingResults[0];
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      data: trackingResults
    });

  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to track shipments'
    }, { status: 500 });
  }
}
