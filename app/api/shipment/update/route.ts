import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    
    if (!waybill) {
      return NextResponse.json(
        { success: false, error: 'Waybill number is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    
    console.log('[Shipment Update API] Updating shipment:', { waybill, updateData });

    const result = await shipmentService.updateShipment(waybill, updateData);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error: any) {
    console.error('[Shipment Update API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update shipment' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    
    if (!waybill) {
      return NextResponse.json(
        { success: false, error: 'Waybill number is required' },
        { status: 400 }
      );
    }

    console.log('[Shipment Cancel API] Cancelling shipment:', waybill);

    const result = await shipmentService.cancelShipmentByWaybill(waybill);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error: any) {
    console.error('[Shipment Cancel API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to cancel shipment' 
      },
      { status: 500 }
    );
  }
}
