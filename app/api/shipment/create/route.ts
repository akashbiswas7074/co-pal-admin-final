import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';
import type { ShipmentCreateRequest } from '@/types/shipment';

/**
 * Modern Delhivery Shipment API
 * Clean, modular implementation using service layer
 */

// POST: Create shipment
export async function POST(request: NextRequest) {
  try {
    const body: ShipmentCreateRequest = await request.json();
    
    console.log('[Shipment API] Creating shipment:', {
      orderId: body.orderId,
      shipmentType: body.shipmentType,
      pickupLocation: body.pickupLocation
    });

    // Validate required fields
    if (!body.orderId || !body.shipmentType || !body.pickupLocation) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: orderId, shipmentType, pickupLocation'
      }, { status: 400 });
    }

    // Create shipment using service
    const result = await shipmentService.createShipment(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${body.shipmentType} shipment created successfully`,
      data: {
        orderId: body.orderId,
        shipmentType: body.shipmentType,
        waybillNumbers: result.data?.shipmentDetails.waybillNumbers,
        pickupLocation: body.pickupLocation,
        shipmentDetails: result.data?.shipmentDetails,
        delhiveryResponse: result.data?.delhiveryResponse
      }
    });

  } catch (error: any) {
    console.error('[Shipment API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create shipment'
    }, { status: 500 });
  }
}

// GET: Fetch shipment details
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

    console.log('[Shipment API] Fetching shipment details for order:', orderId);

    const result = await shipmentService.getShipmentDetails(orderId);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Shipment API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch shipment details'
    }, { status: 500 });
  }
}
