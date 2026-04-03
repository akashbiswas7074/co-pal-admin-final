import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

/**
 * Shipment Management API
 * Handle shipment operations like edit, cancel, etc.
 */

// PUT: Edit shipment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { waybill, editData } = body;

    if (!waybill || !editData) {
      return NextResponse.json({
        success: false,
        error: 'waybill and editData are required'
      }, { status: 400 });
    }

    console.log('[Shipment Management API] Editing shipment:', waybill);

    const result = await shipmentService.editShipment(waybill, editData);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Shipment Management API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to edit shipment'
    }, { status: 500 });
  }
}

// DELETE: Cancel shipment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');

    if (!waybill) {
      return NextResponse.json({
        success: false,
        error: 'waybill parameter is required'
      }, { status: 400 });
    }

    console.log('[Shipment Management API] Cancelling shipment:', waybill);

    const result = await shipmentService.cancelShipment(waybill);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Shipment Management API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to cancel shipment'
    }, { status: 500 });
  }
}
