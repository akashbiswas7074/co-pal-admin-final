import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get current user to check role
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get orders with shipment data
    const orders = await Order.find({
      status: { $in: ['confirmed', 'processing', 'dispatched', 'delivered'] }
    })
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "products.product",
        select: "name images price",
      })
      .populate({
        path: "orderItems.product",
        select: "name images price",
      })
      .sort({ createdAt: -1 });
    
    // Transform orders to shipment format
    const shipments = orders.map(order => {
      // Use products or orderItems, whichever is available
      const orderProducts = order.products || order.orderItems || [];
      
      // Get customer name from user or shipping address
      const customerName = order.user?.name || 
        (order.shippingAddress?.firstName + ' ' + (order.shippingAddress?.lastName || '')).trim() || 
        'Unknown Customer';
      
      return {
        _id: order._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: customerName,
        customerEmail: order.user?.email || 'N/A',
        status: order.status,
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippingAddress: order.shippingAddress || {},
        products: orderProducts,
        shipmentDetails: order.shipmentDetails,
        waybillNumber: order.waybillNumber,
        trackingNumber: order.trackingNumber,
        shipmentCreated: order.shipmentCreated || false,
        shipmentStatus: order.shipmentStatus || 'pending',
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        paymentMode: order.paymentMode || 'cod',
        paymentStatus: order.isPaid ? 'paid' : 'pending',
        pickupLocation: order.pickupLocation || 'Main Warehouse',
        shippingMode: order.shippingMode || 'Surface',
        weight: order.weight || 500,
        dimensions: order.dimensions || { length: 10, width: 10, height: 10 },
        fragileShipment: order.fragileShipment || false,
        dangerousGoods: order.dangerousGoods || false,
        cod_amount: order.paymentMode === 'cod' ? (order.totalAmount || 0) : 0,
        availableActions: getAvailableActions(order)
      };
    });
    
    return NextResponse.json(shipments, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ 
      error: "Failed to fetch shipments", 
      details: error.message 
    }, { status: 500 });
  }
}

function getAvailableActions(order: any) {
  const actions = [];
  
  // Based on order status, determine available actions
  switch (order.status?.toLowerCase()) {
    case 'confirmed':
      actions.push('create_shipment');
      break;
    case 'processing':
      if (order.shipmentCreated) {
        actions.push('update_shipment', 'cancel_shipment', 'generate_label');
      } else {
        actions.push('create_shipment');
      }
      break;
    case 'dispatched':
      actions.push('track_shipment', 'generate_label');
      break;
    case 'delivered':
      actions.push('view_details');
      break;
  }
  
  return actions;
}
