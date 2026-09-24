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

// DELETE: Cancel or Delete shipment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const id = searchParams.get('id');
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action'); // 'delete' or 'cancel'

    if (action === 'delete' || id || searchParams.get('permanent') === 'true') {
      console.log('[Shipment Management API] Deleting shipment permanently:', { id, waybill, orderId });
      const result = await shipmentService.deleteShipment({
        id: id || undefined,
        waybill: waybill || undefined,
        orderId: orderId || undefined
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

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
      error: error.message || 'Failed to process shipment deletion/cancellation'
    }, { status: 500 });
  }
}
