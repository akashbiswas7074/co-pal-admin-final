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
    
    const body = await req.json();
    const { waybill, cancellation = true } = body;
    
    if (!waybill) {
      return NextResponse.json({ error: "Waybill number is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find order by waybill
    const order = await Order.findOne({ waybillNumber: waybill });
    if (!order) {
      return NextResponse.json({ error: "Order not found with this waybill" }, { status: 404 });
    }
    
    // Check if cancellation is allowed
    const allowedStatuses = ['processing', 'manifested', 'in_transit', 'pending'];
    if (!allowedStatuses.includes(order.shipmentStatus?.toLowerCase() || order.status.toLowerCase())) {
      return NextResponse.json({ 
        error: `Shipment cannot be cancelled. Current status: ${order.shipmentStatus || order.status}` 
      }, { status: 400 });
    }
    
    // Call Delhivery API to cancel shipment
    const delhiveryResponse = await cancelDelhiveryShipment(waybill);
    
    if (delhiveryResponse.success) {
      // Update order status
      await Order.findByIdAndUpdate(order._id, {
        shipmentStatus: 'cancelled',
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Shipment cancelled by admin'
      });
      
      return NextResponse.json({
        success: true,
        message: "Shipment cancelled successfully",
        waybill: waybill
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: delhiveryResponse.error,
        message: "Failed to cancel shipment"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error cancelling shipment:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to cancel shipment",
      details: error.message
    }, { status: 500 });
  }
}

async function cancelDelhiveryShipment(waybill: string) {
  try {
    const apiToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.DELHIVERY_PRODUCTION_URL 
      : 'https://staging-express.delhivery.com';
    
    if (!apiToken) {
      return {
        success: false,
        error: "Delhivery API token not configured"
      };
    }
    
    const response = await fetch(`${baseUrl}/api/p/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        waybill: waybill,
        cancellation: "true"
      })
    });
    
    const data = await response.json();
    
    if (response.ok && !data.error) {
      return {
        success: true,
        rawResponse: data
      };
    } else {
      return {
        success: false,
        error: data.error || 'Delhivery API error',
        rawResponse: data
      };
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}
