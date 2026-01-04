import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Update some orders to have confirmed status for testing
    const result = await Order.updateMany(
      { 
        status: { $in: ['pending', 'processing'] },
        shipmentCreated: { $ne: true }
      },
      { 
        $set: { 
          status: 'confirmed',
          paymentMode: 'cod',
          totalAmount: 100 // Set a default amount if missing
        }
      }
    );
    
    // Also update orders that might have undefined paymentMode
    const paymentModeResult = await Order.updateMany(
      { 
        paymentMode: { $exists: false }
      },
      { 
        $set: { 
          paymentMode: 'cod'
        }
      }
    );
    
    // Get updated orders
    const orders = await Order.find({
      status: 'confirmed',
      shipmentCreated: { $ne: true }
    })
      .populate('user', 'name email')
      .limit(5);
    
    return NextResponse.json({
      message: "Orders updated for testing",
      modifiedCount: result.modifiedCount,
      paymentModeUpdated: paymentModeResult.modifiedCount,
      availableOrders: orders.map(order => ({
        _id: order._id,
        status: order.status,
        paymentMode: order.paymentMode,
        customerName: order.user?.name || 'Test Customer',
        totalAmount: order.totalAmount
      }))
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating test orders:', error);
    return NextResponse.json({ 
      error: "Failed to update test orders", 
      details: error.message 
    }, { status: 500 });
  }
}
