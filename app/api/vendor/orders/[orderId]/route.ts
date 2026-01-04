import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import User from '@/lib/database/models/user.model';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectToDatabase();
    
    const { orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the order with user details
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error: any) {
    console.error('[Vendor Order Details API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch order details'
    }, { status: 500 });
  }
}
