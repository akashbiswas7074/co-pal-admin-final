import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

/**
 * Delhivery Shipment Edit API
 * Updates existing shipments in Delhivery system for allowed statuses
 * Supports editing: name, phone, address, payment mode, weight, dimensions, etc.
 */

interface ShipmentEditData {
  orderId: string;
  waybillNumber: string;
  editData: {
    name?: string;
    add?: string;
    pin?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    payment_mode?: 'COD' | 'Prepaid';
    cod_amount?: string;
    total_amount?: string;
    weight?: string;
    shipment_width?: string;
    shipment_height?: string;
    shipment_length?: string;
    shipping_mode?: string;
    products_desc?: string;
    quantity?: string;
    fragile_shipment?: boolean;
    dangerous_good?: boolean;
    plastic_packaging?: boolean;
  };
}

interface DelhiveryEditPayload {
  waybill: string;
  name?: string;
  add?: string;
  pin?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  payment_mode?: string;
  cod_amount?: string;
  total_amount?: string;
  weight?: string;
  shipment_width?: string;
  shipment_height?: string;
  shipment_length?: string;
  shipping_mode?: string;
  products_desc?: string;
  quantity?: string;
  fragile_shipment?: boolean;
  dangerous_good?: boolean;
  plastic_packaging?: boolean;
}

// Helper function to check if shipment can be edited
function canEditShipment(status: string): boolean {
  // Delhivery allows editing only for these statuses
  const editableStatuses = [
    'Dispatched',
    'Pickup Scheduled',
    'Picked Up',
    'In Transit',
    'Reached Destination Hub'
  ];
  return editableStatuses.includes(status);
}

// Helper function to call Delhivery Edit API
async function editDelhiveryShipment(editPayload: DelhiveryEditPayload) {
  const token = process.env.DELHIVERY_AUTH_TOKEN;
  if (!token) {
    throw new Error('Delhivery auth token not configured');
  }

  // Use production URL for edit
  const apiUrl = 'https://track.delhivery.com/api/cmu/edit.json';
  
  console.log('[Shipment Edit API] Editing shipment with payload:', JSON.stringify(editPayload, null, 2));

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: `format=json&data=${JSON.stringify(editPayload)}`
  });

  console.log('[Shipment Edit API] Delhivery response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Shipment Edit API] Delhivery API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('[Shipment Edit API] Delhivery response:', responseData);
  
  return responseData;
}

// POST: Edit shipment
export async function POST(request: NextRequest) {
  console.log('[Shipment Edit API] POST request received');
  
  try {
    await connectToDatabase();
    
    const body: ShipmentEditData = await request.json();
    const { orderId, waybillNumber, editData } = body;

    console.log('[Shipment Edit API] Request body:', body);

    // Validate required parameters
    if (!orderId || !waybillNumber) {
      return NextResponse.json(
        { success: false, error: 'Order ID and waybill number are required' },
        { status: 400 }
      );
    }

    if (!editData || Object.keys(editData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Edit data is required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId).lean() as any;
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if shipment exists
    if (!order.shipmentCreated || !order.shipmentDetails) {
      return NextResponse.json(
        { success: false, error: 'No shipment found for this order' },
        { status: 400 }
      );
    }

    // Check if waybill number exists in order
    const waybillNumbers = order.shipmentDetails.waybillNumbers || [];
    if (!waybillNumbers.includes(waybillNumber)) {
      return NextResponse.json(
        { success: false, error: 'Waybill number not found in order' },
        { status: 400 }
      );
    }

    // Check if shipment can be edited based on current status
    if (!canEditShipment(order.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Shipment cannot be edited in "${order.status}" status. Editing is allowed only for: Dispatched, Pickup Scheduled, Picked Up, In Transit, Reached Destination Hub` 
        },
        { status: 400 }
      );
    }

    // Create edit payload for Delhivery
    const { waybill, ...editDataWithoutWaybill } = editData;
    const editPayload: DelhiveryEditPayload = {
      waybill: waybillNumber,
      ...editDataWithoutWaybill
    };

    // Call Delhivery Edit API
    try {
      const delhiveryResponse = await editDelhiveryShipment(editPayload);

      // Check if Delhivery response is successful
      if (delhiveryResponse.error || !delhiveryResponse.success) {
        // For demo purposes, create a mock successful response
        if (process.env.NODE_ENV === 'development') {
          console.log('[Shipment Edit API] Creating demo edit response...');
          
          const mockSuccessResponse = {
            success: true,
            message: 'Demo shipment edited successfully',
            waybill: waybillNumber
          };

          // Update order with edited shipment details
          const updateData: any = {
            'shipmentDetails.lastEditedAt': new Date(),
            'shipmentDetails.editHistory': [
              ...(order.shipmentDetails.editHistory || []),
              {
                editedAt: new Date(),
                editedData: editData,
                delhiveryResponse: mockSuccessResponse
              }
            ]
          };

          // If address was edited, update shipping address in order
          if (editData.name || editData.add || editData.pin || editData.city || editData.state || editData.phone) {
            const shippingAddress = order.shippingAddress || order.deliveryAddress || {};
            
            if (editData.name) {
              const nameParts = editData.name.split(' ');
              updateData['shippingAddress.firstName'] = nameParts[0] || '';
              updateData['shippingAddress.lastName'] = nameParts.slice(1).join(' ') || '';
            }
            if (editData.add) updateData['shippingAddress.address1'] = editData.add;
            if (editData.pin) updateData['shippingAddress.zipCode'] = editData.pin;
            if (editData.city) updateData['shippingAddress.city'] = editData.city;
            if (editData.state) updateData['shippingAddress.state'] = editData.state;
            if (editData.phone) updateData['shippingAddress.phoneNumber'] = editData.phone;
          }

          // If payment mode was changed
          if (editData.payment_mode) {
            updateData['paymentMethod'] = editData.payment_mode.toLowerCase();
          }

          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
          );

          return NextResponse.json({
            success: true,
            message: 'Demo shipment edited successfully (Delhivery integration needed for production)',
            data: {
              orderId,
              waybillNumber,
              editedData: editData,
              delhiveryResponse: mockSuccessResponse,
              updatedOrder: {
                _id: updatedOrder?._id,
                status: updatedOrder?.status,
                shipmentDetails: updatedOrder?.shipmentDetails,
                shippingAddress: updatedOrder?.shippingAddress
              }
            }
          });
        }
        
        return NextResponse.json({
          success: false,
          error: `Delhivery API error: ${delhiveryResponse.message || delhiveryResponse.rmk || 'Failed to edit shipment'}`
        }, { status: 400 });
      }

      // Update order with edited shipment details
      const updateData: any = {
        'shipmentDetails.lastEditedAt': new Date(),
        'shipmentDetails.editHistory': [
          ...(order.shipmentDetails.editHistory || []),
          {
            editedAt: new Date(),
            editedData: editData,
            delhiveryResponse
          }
        ]
      };

      // If address was edited, update shipping address in order
      if (editData.name || editData.add || editData.pin || editData.city || editData.state || editData.phone) {
        if (editData.name) {
          const nameParts = editData.name.split(' ');
          updateData['shippingAddress.firstName'] = nameParts[0] || '';
          updateData['shippingAddress.lastName'] = nameParts.slice(1).join(' ') || '';
        }
        if (editData.add) updateData['shippingAddress.address1'] = editData.add;
        if (editData.pin) updateData['shippingAddress.zipCode'] = editData.pin;
        if (editData.city) updateData['shippingAddress.city'] = editData.city;
        if (editData.state) updateData['shippingAddress.state'] = editData.state;
        if (editData.phone) updateData['shippingAddress.phoneNumber'] = editData.phone;
      }

      // If payment mode was changed
      if (editData.payment_mode) {
        updateData['paymentMethod'] = editData.payment_mode.toLowerCase();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );

      console.log('[Shipment Edit API] Order updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Shipment edited successfully',
        data: {
          orderId,
          waybillNumber,
          editedData: editData,
          delhiveryResponse,
          updatedOrder: {
            _id: updatedOrder?._id,
            status: updatedOrder?.status,
            shipmentDetails: updatedOrder?.shipmentDetails,
            shippingAddress: updatedOrder?.shippingAddress
          }
        }
      });

    } catch (delhiveryError: any) {
      console.error('[Shipment Edit API] Delhivery API Error:', delhiveryError);
      
      return NextResponse.json({
        success: false,
        error: `Failed to edit shipment: ${delhiveryError.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Shipment Edit API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to edit shipment'
    }, { status: 500 });
  }
}

// GET: Check if shipment can be edited and get editable fields
export async function GET(request: NextRequest) {
  console.log('[Shipment Edit API] GET request received');
  
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const waybillNumber = searchParams.get('waybillNumber');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId)
      .select('_id status shipmentCreated shipmentDetails shippingAddress paymentMethod orderItems')
      .lean() as any;

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if shipment exists
    if (!order.shipmentCreated || !order.shipmentDetails) {
      return NextResponse.json(
        { success: false, error: 'No shipment found for this order' },
        { status: 400 }
      );
    }

    const waybillNumbers = order.shipmentDetails.waybillNumbers || [];
    
    // If waybill number is provided, check if it exists
    if (waybillNumber && !waybillNumbers.includes(waybillNumber)) {
      return NextResponse.json(
        { success: false, error: 'Waybill number not found in order' },
        { status: 400 }
      );
    }

    const canEdit = canEditShipment(order.status);
    const shippingAddress = order.shippingAddress || order.deliveryAddress || {};
    const totalQuantity = order.orderItems?.reduce((sum: number, item: any) => sum + (item.qty || item.quantity || 1), 0) || 1;
    const productsDesc = order.orderItems?.map((item: any) => item.name).join(', ') || 'Order Items';

    // Current shipment data that can be edited
    const editableFields = {
      name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
      add: `${shippingAddress.address1 || ''}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}`,
      pin: shippingAddress.zipCode || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      country: shippingAddress.country || 'India',
      phone: shippingAddress.phoneNumber || '',
      payment_mode: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      cod_amount: order.paymentMethod === 'cod' ? (order.total || order.totalAmount || 0).toString() : '0',
      total_amount: (order.total || order.totalAmount || 0).toString(),
      weight: order.shipmentDetails.weight || '500',
      shipment_width: order.shipmentDetails.dimensions?.width?.toString() || '10',
      shipment_height: order.shipmentDetails.dimensions?.height?.toString() || '10',
      shipment_length: order.shipmentDetails.dimensions?.length?.toString() || '10',
      shipping_mode: order.shipmentDetails.shippingMode || 'Surface',
      products_desc: productsDesc,
      quantity: totalQuantity.toString(),
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false
    };

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        waybillNumbers,
        canEdit,
        editableStatuses: [
          'Dispatched',
          'Pickup Scheduled', 
          'Picked Up',
          'In Transit',
          'Reached Destination Hub'
        ],
        currentData: editableFields,
        editHistory: order.shipmentDetails.editHistory || [],
        lastEditedAt: order.shipmentDetails.lastEditedAt
      }
    });

  } catch (error: any) {
    console.error('[Shipment Edit API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch shipment edit details'
    }, { status: 500 });
  }
}
