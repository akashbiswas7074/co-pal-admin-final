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
    const order = await Order.findById(orderId).lean() as any;

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Try to populate user details if possible
    let enrichedOrder = order;
    try {
      if (order.user) {
        // Attempt to find user details separately
        const user = await User.findById(order.user).select('name email').lean() as any;
        if (user) {
          enrichedOrder = {
            ...order,
            user: {
              name: user.name,
              email: user.email,
              _id: user._id
            }
          };
        } else {
          // If user not found, provide fallback data
          enrichedOrder = {
            ...order,
            user: {
              name: 'Unknown User',
              email: 'unknown@example.com',
              _id: order.user
            }
          };
        }
      }
    } catch (populateError) {
      console.warn('[Admin Order Details API] User population failed:', populateError);
      // Continue with order data without user details
      enrichedOrder = {
        ...order,
        user: {
          name: 'Unknown User',
          email: 'unknown@example.com',
          _id: order.user
        }
      };
    }

    return NextResponse.json({
      success: true,
      order: enrichedOrder
    });

  } catch (error: any) {
    console.error('[Admin Order Details API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch order details'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
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

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} deleted successfully`,
      deletedId: orderId
    });
  } catch (error: any) {
    console.error('[Admin Order DELETE API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete order'
    }, { status: 500 });
  }
}

