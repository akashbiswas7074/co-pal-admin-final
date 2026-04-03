import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get a sample of orders for debugging
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .limit(5)
      .sort({ createdAt: -1 });
    
    const debugInfo = orders.map(order => ({
      _id: order._id,
      status: order.status,
      paymentMode: order.paymentMode,
      totalAmount: order.totalAmount,
      shipmentCreated: order.shipmentCreated,
      user: order.user,
      shippingAddress: order.shippingAddress,
      products: order.products?.length || 0,
      orderItems: order.orderItems?.length || 0,
      createdAt: order.createdAt
    }));
    
    return NextResponse.json({
      message: "Debug info for orders",
      ordersCount: orders.length,
      orders: debugInfo
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching debug info:', error);
    return NextResponse.json({ 
      error: "Failed to fetch debug info", 
      details: error.message 
    }, { status: 500 });
  }
}
