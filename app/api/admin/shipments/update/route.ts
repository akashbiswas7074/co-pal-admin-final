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
    const { waybill, updates } = body;
    
    if (!waybill) {
      return NextResponse.json({ error: "Waybill number is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find order by waybill
    const order = await Order.findOne({ waybillNumber: waybill });
    if (!order) {
      return NextResponse.json({ error: "Order not found with this waybill" }, { status: 404 });
    }
    
    // Check if update is allowed
    const allowedStatuses = ['processing', 'manifested', 'in_transit', 'pending'];
    if (!allowedStatuses.includes(order.shipmentStatus?.toLowerCase() || order.status.toLowerCase())) {
      return NextResponse.json({ 
        error: `Shipment cannot be updated. Current status: ${order.shipmentStatus || order.status}` 
      }, { status: 400 });
    }
    
    // Call Delhivery API to update shipment
    const delhiveryResponse = await updateDelhiveryShipment(waybill, updates);
    
    if (delhiveryResponse.success) {
      // Update order with new details
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (updates.name) updateData['shippingAddress.firstName'] = updates.name.split(' ')[0];
      if (updates.name) updateData['shippingAddress.lastName'] = updates.name.split(' ').slice(1).join(' ');
      if (updates.phone) updateData['shippingAddress.phone'] = updates.phone;
      if (updates.add) updateData['shippingAddress.address1'] = updates.add;
      if (updates.weight) updateData.weight = updates.weight;
      if (updates.shipment_height) updateData['dimensions.height'] = updates.shipment_height;
      if (updates.shipment_width) updateData['dimensions.width'] = updates.shipment_width;
      if (updates.shipment_length) updateData['dimensions.length'] = updates.shipment_length;
      if (updates.cod) updateData.totalAmount = updates.cod;
      if (updates.pt) updateData.paymentMode = updates.pt.toLowerCase();
      
      await Order.findByIdAndUpdate(order._id, updateData);
      
      return NextResponse.json({
        success: true,
        message: "Shipment updated successfully",
        waybill: waybill,
        updates: updates
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: delhiveryResponse.error,
        message: "Failed to update shipment"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to update shipment",
      details: error.message
    }, { status: 500 });
  }
}

async function updateDelhiveryShipment(waybill: string, updates: any) {
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
    
    const payload = {
      waybill: waybill,
      ...updates
    };
    
    const response = await fetch(`${baseUrl}/api/p/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
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
