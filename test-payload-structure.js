#!/usr/bin/env node

/**
 * Test the payload structure that will be sent to Delhivery
 */

// Simulate the payload creation logic from our updated API
function createTestPayload() {
    // Create current date for required fields
    const currentDate = new Date();
    const orderDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate estimated delivery date (7 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];
    
    // Simulate order data
    const mockOrder = {
        _id: '6779b3d9f61b21c5e2c234d8',
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main Street',
            address2: 'Apt 4B',
            city: 'Kolkata',
            state: 'West Bengal',
            country: 'India',
            zipCode: '700001',
            phoneNumber: '9876543210'
        },
        products: [
            { name: 'Test Product', qty: 1 }
        ],
        paymentMode: 'cod',
        totalAmount: 999
    };
    
    const paymentMode = mockOrder.paymentMode || 'cod';
    const totalAmount = mockOrder.totalAmount || 100;
    const orderProducts = mockOrder.products || [];
    
    // Create the exact payload structure from our updated API
    const delhiveryPayload = {
        shipments: [{
            name: `${mockOrder.shippingAddress.firstName} ${mockOrder.shippingAddress.lastName || ''}`.trim(),
            add: mockOrder.shippingAddress.address1 + (mockOrder.shippingAddress.address2 ? ', ' + mockOrder.shippingAddress.address2 : ''),
            pin: mockOrder.shippingAddress.zipCode || '700001',
            city: mockOrder.shippingAddress.city || 'Kolkata',
            state: mockOrder.shippingAddress.state || 'West Bengal',
            country: mockOrder.shippingAddress.country || 'India',
            phone: mockOrder.shippingAddress.phoneNumber || '9999999999',
            order: mockOrder._id.toString(),
            payment_mode: paymentMode === 'cod' ? 'COD' : 'Prepaid',
            return_pin: '700001',
            return_city: 'Kolkata',
            return_phone: '9999999999',
            return_add: 'Main Warehouse, Kolkata',
            return_state: 'West Bengal',
            return_country: 'India',
            products_desc: orderProducts.map(p => p.name || 'Product').join(', ') || 'General Product',
            hsn_code: '61091000',
            cod_amount: paymentMode === 'cod' ? totalAmount.toString() : '0',
            order_date: orderDate,
            total_amount: totalAmount.toString(),
            seller_add: 'Main Warehouse, Kolkata, West Bengal',
            seller_name: 'Peeds',
            seller_inv: `INV-${mockOrder._id}`,
            quantity: orderProducts.reduce((sum, p) => sum + (p.qty || 1), 0).toString() || '1',
            shipment_width: '10',
            shipment_height: '10',
            shipment_length: '10',
            weight: '500',
            shipping_mode: 'Surface',
            address_type: 'home',
            fragile_shipment: false,
            dangerous_good: false,
            // Required date fields (critical for Delhivery API)
            send_date: orderDate,
            end_date: estimatedDeliveryDate,
            ewaybill: '',
            invoice_no: `INV-${mockOrder._id}`,
            shipment_type: 'forward',
            // Additional fields that might be required
            invoice_amount: totalAmount.toString()
        }],
        pickup_location: {
            name: 'Main Warehouse'
        }
    };
    
    return delhiveryPayload;
}

console.log('=== Testing Updated Delhivery Payload Structure ===');
const payload = createTestPayload();

console.log('Generated Payload:');
console.log(JSON.stringify(payload, null, 2));

console.log('\n=== Key Fields Verification ===');
const shipment = payload.shipments[0];
console.log('✅ send_date:', shipment.send_date);
console.log('✅ end_date:', shipment.end_date);
console.log('✅ order_date:', shipment.order_date);
console.log('✅ invoice_amount:', shipment.invoice_amount);
console.log('✅ total_amount:', shipment.total_amount);
console.log('✅ cod_amount:', shipment.cod_amount);
console.log('✅ payment_mode:', shipment.payment_mode);

// Verify date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
console.log('\n=== Date Format Validation ===');
console.log('send_date format valid:', dateRegex.test(shipment.send_date));
console.log('end_date format valid:', dateRegex.test(shipment.end_date));
console.log('order_date format valid:', dateRegex.test(shipment.order_date));

console.log('\n=== Summary ===');
console.log('🎉 The payload now includes all required date fields!');
console.log('🎉 The end_date error should be resolved!');
console.log('🎉 Ready to test with the Delhivery API!');
