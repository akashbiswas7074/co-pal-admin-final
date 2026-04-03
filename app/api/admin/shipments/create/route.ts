import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

interface DelhiveryShipmentPayload {
  shipments: Array<{
    name: string;
    add: string;
    pin: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    order: string;
    payment_mode: string;
    return_pin?: string;
    return_city?: string;
    return_phone?: string;
    return_add?: string;
    return_state?: string;
    return_country?: string;
    products_desc: string;
    hsn_code?: string;
    cod_amount?: string;
    order_date?: string;
    total_amount: string;
    seller_add?: string;
    seller_name?: string;
    seller_inv?: string;
    quantity: string;
    waybill?: string;
    shipment_width: string;
    shipment_height: string;
    shipment_length?: string;
    weight: string;
    shipping_mode: string;
    address_type?: string;
    fragile_shipment?: boolean;
    dangerous_good?: boolean;
    // Required date fields
    send_date?: string;
    end_date?: string;
    ewaybill?: string;
    invoice_no?: string;
    shipment_type?: string;
    invoice_amount?: string;
  }>;
  pickup_location: {
    name: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { orderId, shipmentType = 'FORWARD', pickupLocation = 'Main Warehouse', shippingMode = 'Surface' } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get order details with populated user
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Debug log to check order structure
    console.log('Order structure:', {
      _id: order._id,
      status: order.status,
      paymentMode: order.paymentMode,
      shippingAddress: order.shippingAddress,
      products: order.products?.length || 0,
      orderItems: order.orderItems?.length || 0,
      user: order.user,
      shipmentCreated: order.shipmentCreated
    });

    // Check if shipment already exists
    if (order.shipmentCreated) {
      return NextResponse.json({ error: "Shipment already created for this order" }, { status: 400 });
    }

    // Validate order status
    const allowedStatuses = ['confirmed', 'processing'];
    if (!allowedStatuses.includes(order.status.toLowerCase())) {
      return NextResponse.json({ 
        error: `Order must be in one of these statuses: ${allowedStatuses.join(', ')} for shipment creation. Current status: ${order.status}` 
      }, { status: 400 });
    }

    // Use products or orderItems, whichever is available
    const orderProducts = order.products || order.orderItems || [];
    
    if (!orderProducts || orderProducts.length === 0) {
      return NextResponse.json({ error: "No products found in order" }, { status: 400 });
    }

    // Validate order data and set defaults
    const paymentMode = order.paymentMode || 'cod'; // Default to COD if not set
    const totalAmount = parseFloat((order.totalAmount || 100).toString()).toFixed(2); // Fix floating point precision
    
    // Validate shipping address
    if (!order.shippingAddress || !order.shippingAddress.firstName || !order.shippingAddress.address1) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    // Create current date for required fields
    const currentDate = new Date();
    const orderDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate estimated delivery date (7 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];

    // Create Delhivery payload with all required fields
    const delhiveryPayload: DelhiveryShipmentPayload = {
      shipments: [{
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
        add: order.shippingAddress.address1 + (order.shippingAddress.address2 ? ', ' + order.shippingAddress.address2 : ''),
        pin: order.shippingAddress.zipCode || order.shippingAddress.postalCode || '700001',
        city: order.shippingAddress.city || 'Kolkata',
        state: order.shippingAddress.state || 'West Bengal',
        country: order.shippingAddress.country || 'India',
        phone: order.shippingAddress.phoneNumber || order.shippingAddress.phone || order.user?.phone || '9999999999',
        order: order._id.toString(),
        payment_mode: paymentMode === 'cod' ? 'COD' : 'Prepaid',
        return_pin: process.env.NEXT_PUBLIC_WAREHOUSE_PINCODE || '700001',
        return_city: 'Kolkata',
        return_phone: '9999999999',
        return_add: 'Main Warehouse, Kolkata',
        return_state: 'West Bengal',
        return_country: 'India',
        products_desc: orderProducts.map((p: any) => p.name || 'Product').join(', ') || 'General Product',
        hsn_code: '61091000',
        cod_amount: paymentMode === 'cod' ? totalAmount : '0',
        order_date: orderDate,
        total_amount: totalAmount,
        seller_add: 'Main Warehouse, Kolkata, West Bengal',
        seller_name: 'Peeds',
        seller_inv: `INV-${order._id}`,
        quantity: orderProducts.reduce((sum: number, p: any) => sum + (p.qty || p.quantity || 1), 0).toString() || '1',
        shipment_width: '10',
        shipment_height: '10',
        shipment_length: '10',
        weight: '500',
        shipping_mode: shippingMode,
        address_type: 'home',
        fragile_shipment: false,
        dangerous_good: false,
        // Required date fields (critical for Delhivery API)
        send_date: orderDate,
        end_date: estimatedDeliveryDate,
        ewaybill: '',
        invoice_no: `INV-${order._id}`,
        shipment_type: 'forward',
        // Additional fields that might be required
        invoice_amount: totalAmount
      }],
      pickup_location: {
        name: pickupLocation
      }
    };

    // Debug log the payload
    console.log('Delhivery API Payload:', JSON.stringify(delhiveryPayload, null, 2));
    
    // Call Delhivery API
    const delhiveryResponse = await createDelhiveryShipment(delhiveryPayload);
    
    if (delhiveryResponse.success) {
      // Update order with shipment details
      await Order.findByIdAndUpdate(orderId, {
        shipmentCreated: true,
        shipmentStatus: 'created',
        waybillNumber: delhiveryResponse.waybill,
        trackingNumber: delhiveryResponse.waybill,
        shipmentDetails: {
          waybillNumbers: [delhiveryResponse.waybill],
          pickupLocation,
          shippingMode,
          shipmentType,
          createdAt: new Date(),
          delhiveryResponse: delhiveryResponse.rawResponse
        },
        pickupLocation,
        shippingMode,
        status: 'processing'
      });
      
      return NextResponse.json({
        success: true,
        message: "Shipment created successfully",
        waybill: delhiveryResponse.waybill,
        shipmentDetails: {
          waybillNumbers: [delhiveryResponse.waybill],
          pickupLocation,
          shippingMode,
          shipmentType,
          createdAt: new Date()
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: delhiveryResponse.error,
        message: "Failed to create shipment"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to create shipment",
      details: error.message
    }, { status: 500 });
  }
}

async function createDelhiveryShipment(payload: DelhiveryShipmentPayload) {
  try {
    const apiToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN;
    // Use production URL by default for better reliability
    const baseUrl = 'https://track.delhivery.com';
    
    if (!apiToken) {
      return {
        success: false,
        error: "Delhivery API token not configured"
      };
    }
    
    // Prepare the request body as form data
    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify(payload));
    
    console.log('Delhivery API Request:', {
      url: `${baseUrl}/api/cmu/create.json`,
      token: apiToken ? `${apiToken.substring(0, 10)}...` : 'Not set',
      payload: payload
    });
    
    const response = await fetch(`${baseUrl}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });
    
    const data = await response.json();
    
    console.log('Delhivery API Response:', {
      status: response.status,
      ok: response.ok,
      data: data
    });
    
    if (response.ok && data.success) {
      return {
        success: true,
        waybill: data.packages?.[0]?.waybill,
        rawResponse: data
      };
    } else {
      return {
        success: false,
        error: data.rmk || data.error || 'Delhivery API error',
        rawResponse: data
      };
    }
    
  } catch (error: any) {
    console.error('Delhivery API Error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}
