import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

/**
 * Shipment Details API
 * Get shipment information for orders
 */

// GET: Get shipment details for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId parameter is required'
      }, { status: 400 });
    }

    console.log('[Shipment Details API] Fetching details for order:', orderId);

    const result = await shipmentService.getShipmentDetails(orderId);
    
    console.log('[Shipment Details API] Service result:', JSON.stringify(result, null, 2));
    console.log('[Shipment Details API] Warehouses in result:', result.data?.warehouses);
    console.log('[Shipment Details API] Warehouses count:', result.data?.warehouses?.length);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    // Make sure warehouses are properly serialized
    if (result.data && result.data.warehouses) {
      console.log('[Shipment Details API] Ensuring warehouses are serializable...');
      result.data.warehouses = result.data.warehouses.map(w => ({
        name: w.name,
        address: w.address,
        pincode: w.pincode,
        phone: w.phone,
        active: w.active
      }));
      console.log('[Shipment Details API] Cleaned warehouses:', result.data.warehouses);
    }

    const response = NextResponse.json(result);
    console.log('[Shipment Details API] Returning response with warehouses:', result.data?.warehouses?.length || 0);
    
    return response;

  } catch (error: any) {
    console.error('[Shipment Details API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch shipment details'
    }, { status: 500 });
  }
}
