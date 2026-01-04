import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

/**
 * Shipment Status Update API
 * Updates shipment status and order status throughout the shipment lifecycle
 */

interface StatusUpdateData {
  orderId: string;
  newStatus: string;
  waybillNumber?: string;
  trackingUrl?: string;
  reason?: string;
  updatedBy?: string;
}

// Status flow mapping
const STATUS_FLOW = {
  'Confirmed': 'Dispatched',
  'Dispatched': 'Completed',
  'shipped': 'delivered',
  'processing': 'Confirmed'
};

const VALID_STATUSES = [
  'pending',
  'processing', 
  'Confirmed',
  'shipped',
  'Dispatched',
  'delivered',
  'Completed',
  'cancelled',
  'refunded'
];

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { orderId, newStatus, waybillNumber, trackingUrl, reason, updatedBy } = body as StatusUpdateData;
    
    console.log('[Shipment Status API] POST request received:', { orderId, newStatus, waybillNumber });
    
    // Validate required fields
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'Order ID and new status are required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${newStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('[Shipment Status API] Current order status:', order.status);
    
    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    };
    
    // Handle specific status transitions
    switch (newStatus) {
      case 'Dispatched':
        updateData.shipmentCreated = true;
        if (waybillNumber) {
          updateData['shipmentDetails.waybillNumbers'] = [waybillNumber];
        }
        if (trackingUrl) {
          updateData['shipmentDetails.trackingUrl'] = trackingUrl;
        }
        // Update all order items to Dispatched
        updateData['orderItems.$[].status'] = 'Dispatched';
        break;
        
      case 'Completed':
      case 'delivered':
        updateData.deliveredAt = new Date();
        // Update all order items to completed
        updateData['orderItems.$[].status'] = newStatus;
        updateData['orderItems.$[].productCompletedAt'] = new Date();
        break;
        
      case 'cancelled':
        if (reason) {
          updateData.cancelReason = reason;
        }
        updateData.cancelRequestedAt = new Date();
        updateData['orderItems.$[].status'] = 'cancelled';
        break;
        
      case 'Confirmed':
        // Mark as ready for shipment
        updateData.isNew = false;
        updateData['orderItems.$[].status'] = 'Confirmed';
        break;
    }
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }
    
    console.log('[Shipment Status API] Order updated successfully. New status:', updatedOrder.status);
    
    // Log the status change
    const statusLog = {
      orderId: updatedOrder._id,
      previousStatus: order.status,
      newStatus: newStatus,
      updatedBy: updatedBy || 'system',
      updatedAt: new Date(),
      reason: reason || undefined,
      waybillNumber: waybillNumber || undefined
    };
    
    console.log('[Shipment Status API] Status change logged:', statusLog);
    
    return NextResponse.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order: {
        _id: updatedOrder._id,
        status: updatedOrder.status,
        shipmentCreated: updatedOrder.shipmentCreated,
        shipmentDetails: updatedOrder.shipmentDetails,
        deliveredAt: updatedOrder.deliveredAt,
        updatedAt: updatedOrder.updatedAt
      },
      statusLog
    });
    
  } catch (error: any) {
    console.error('[Shipment Status API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update shipment status'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const order = await Order.findById(orderId).select('status shipmentCreated shipmentDetails orderItems deliveredAt updatedAt');
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get available next statuses based on current status
    const currentStatus = order.status;
    const nextStatuses = [];
    
    switch (currentStatus) {
      case 'processing':
        nextStatuses.push('Confirmed');
        break;
      case 'Confirmed':
        nextStatuses.push('Dispatched');
        break;
      case 'Dispatched':
        nextStatuses.push('Completed');
        break;
      case 'shipped':
        nextStatuses.push('delivered');
        break;
    }
    
    // Add common statuses that can be set from any state
    nextStatuses.push('cancelled');
    
    return NextResponse.json({
      success: true,
      data: {
        currentStatus: currentStatus,
        nextStatuses: nextStatuses,
        canUpdateStatus: nextStatuses.length > 0,
        order: {
          _id: order._id,
          status: order.status,
          shipmentCreated: order.shipmentCreated,
          shipmentDetails: order.shipmentDetails,
          deliveredAt: order.deliveredAt,
          updatedAt: order.updatedAt,
          orderItems: order.orderItems
        }
      }
    });
    
  } catch (error: any) {
    console.error('[Shipment Status API] GET Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch shipment status'
    }, { status: 500 });
  }
}
