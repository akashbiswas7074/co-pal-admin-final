import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';
import type { ShipmentCreateRequest } from '@/types/shipment';

/**
 * Shipment Creation API Route
 * delegates all logic to the centralized ShipmentService
 */
export async function POST(request: NextRequest) {
  console.log('[Shipment API] POST request received');
  
  try {
    const body: ShipmentCreateRequest = await request.json();
    console.log('[Shipment API] Request body:', body);

    const result = await shipmentService.createShipment(body);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Shipment API] Error in POST handler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error occurred while creating shipment'
    }, { status: 500 });
  }
}

/**
 * GET: Fetch shipment list or details
 * Also delegates to ShipmentService
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shipmentId = searchParams.get('id');
  const orderId = searchParams.get('orderId');

  try {
    if (shipmentId) {
      if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
        return NextResponse.json({ success: false, error: 'Invalid shipment ID format' }, { status: 400 });
      }
      const result = await shipmentService.getShipmentById(shipmentId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } 
    
    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json({ success: false, error: 'Invalid order ID format' }, { status: 400 });
      }
      const result = await shipmentService.getShipmentDetails(orderId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // Default: List all shipments
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const result = await shipmentService.listShipments({ page, limit });
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[Shipment API] Error in GET handler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error occurred while fetching shipments'
    }, { status: 500 });
  }
}
