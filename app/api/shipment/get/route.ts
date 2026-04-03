import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const shipmentId = searchParams.get('shipmentId');
    
    if (!waybill && !shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Waybill number or shipment ID is required' },
        { status: 400 }
      );
    }

    console.log('[Shipment Details API] Fetching shipment:', { waybill, shipmentId });

    let result;
    if (shipmentId) {
      result = await shipmentService.getShipmentById(shipmentId);
    } else {
      result = await shipmentService.getShipmentByWaybill(waybill!);
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 404 
    });

  } catch (error: any) {
    console.error('[Shipment Details API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch shipment details' 
      },
      { status: 500 }
    );
  }
}
