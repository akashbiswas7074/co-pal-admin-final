import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import Warehouse from '@/lib/database/models/warehouse.model';

/**
 * Bulk Shipment Creation API
 * Creates multiple shipments with common settings
 */

interface BulkShipmentRequest {
  orderIds: string[];
  commonSettings: {
    pickupLocation: string;
    shippingMode: 'Surface' | 'Express';
    shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    customFields?: {
      fragile_shipment?: boolean;
      dangerous_good?: boolean;
      plastic_packaging?: boolean;
      hsn_code?: string;
      ewb?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  console.log('[Bulk Shipment API] POST request received');
  
  try {
    await connectToDatabase();
    
    const body: BulkShipmentRequest = await request.json();
    const { orderIds, commonSettings } = body;
    
    console.log('[Bulk Shipment API] Request body:', body);
    
    // Validate required parameters
    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }
    
    if (!commonSettings.pickupLocation) {
      return NextResponse.json(
        { success: false, error: 'Pickup location is required' },
        { status: 400 }
      );
    }
    
    // Validate orders exist and can have shipments created
    const orders = await Order.find({ 
      _id: { $in: orderIds },
      status: { $in: ['Confirmed', 'Processing'] }
    }).lean();
    
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid orders found for shipment creation' },
        { status: 400 }
      );
    }
    
    // Get warehouse details
    const warehouse = await Warehouse.findOne({ 
      name: commonSettings.pickupLocation, 
      status: 'active' 
    }).lean();
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: `Warehouse "${commonSettings.pickupLocation}" not found or inactive` },
        { status: 400 }
      );
    }
    
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Create shipments for each order
    for (const order of orders) {
      try {
        // Create individual shipment request
        const shipmentRequest = {
          orderId: (order as any)._id.toString(),
          shipmentType: commonSettings.shipmentType,
          pickupLocation: commonSettings.pickupLocation,
          shippingMode: commonSettings.shippingMode,
          weight: commonSettings.weight || 500,
          dimensions: commonSettings.dimensions || {
            length: 10,
            width: 10,
            height: 10
          },
          packages: [],
          customFields: commonSettings.customFields || {}
        };
        
        // Call the individual shipment creation API
        const shipmentResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/shipment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shipmentRequest),
        });
        
        const shipmentResult = await shipmentResponse.json();
        
        if (shipmentResult.success) {
          results.created++;
        } else {
          results.failed++;
          results.errors.push(`Order ${(order as any)._id}: ${shipmentResult.error}`);
        }
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Order ${(order as any)._id}: ${error.message}`);
      }
    }
    
    console.log('[Bulk Shipment API] Results:', results);
    
    return NextResponse.json({
      success: true,
      message: `Bulk shipment creation completed. Created: ${results.created}, Failed: ${results.failed}`,
      data: results
    });
    
  } catch (error: any) {
    console.error('[Bulk Shipment API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create bulk shipments'
    }, { status: 500 });
  }
}
