import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

/**
 * Shipment List API
 * Returns a list of all shipments for the dashboard
 */

export async function GET(request: NextRequest) {
  console.log('[Shipment List API] GET request received');
  
  try {
    const { searchParams: requestParams } = new URL(request.url);
    
    // Try to use new shipment service first
    const useNewService = requestParams.get('useNew') === 'true';
    
    if (useNewService) {
      const options = {
        page: parseInt(requestParams.get('page') || '1'),
        limit: parseInt(requestParams.get('limit') || '10'),
        status: requestParams.get('status') || undefined,
        shipmentType: requestParams.get('shipmentType') || undefined,
        orderId: requestParams.get('orderId') || undefined,
        waybill: requestParams.get('waybill') || undefined,
      };

      console.log('[Shipment List API] Using new shipment service with options:', options);
      const result = await shipmentService.getShipments(options);
      
      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      });
    }
    
    // Fallback to existing logic for backward compatibility
    await connectToDatabase();
    
    const { searchParams: legacySearchParams } = new URL(request.url);
    const limit = parseInt(legacySearchParams.get('limit') || '50');
    const offset = parseInt(legacySearchParams.get('offset') || '0');
    const status = legacySearchParams.get('status');
    const shipmentType = legacySearchParams.get('shipmentType');
    
    // Build query
    const query: any = {
      $or: [
        { shipmentCreated: true },
        { reverseShipment: { $exists: true } },
        { replacementShipment: { $exists: true } }
      ]
    };
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
    // Find orders with shipments
    const orders = await Order.find(query)
      .select('_id status shippingAddress shipmentDetails reverseShipment replacementShipment orderItems createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    // Transform to shipment list format
    const shipmentList = orders.map(order => {
      const shippingAddress = order.shippingAddress || {};
      const shipmentDetails = order.shipmentDetails || order.reverseShipment || order.replacementShipment;
      
      return {
        _id: order._id,
        orderId: order._id.toString(),
        waybillNumbers: shipmentDetails?.waybillNumbers || [],
        status: order.status,
        shipmentType: shipmentDetails?.shipmentType || 'FORWARD',
        pickupLocation: shipmentDetails?.pickupLocation || 'Unknown',
        customerName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Unknown',
        customerPhone: shippingAddress.phoneNumber || shippingAddress.phone || '',
        customerAddress: `${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''}`.trim(),
        createdAt: order.createdAt || new Date(),
        deliveryDate: order.deliveredAt || null,
        trackingInfo: null // Will be populated by tracking API
      };
    });
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: shipmentList,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error: any) {
    console.error('[Shipment List API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch shipment list'
    }, { status: 500 });
  }
}
