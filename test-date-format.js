#!/usr/bin/env node

// Test date formatting for Delhivery API
const currentDate = new Date();
const orderDate = currentDate.toISOString().split('T')[0];
const deliveryDate = new Date();
deliveryDate.setDate(deliveryDate.getDate() + 7);
const estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];

console.log('Current date (send_date):', orderDate);
console.log('Estimated delivery (end_date):', estimatedDeliveryDate);
console.log('Date format validation:', /^\d{4}-\d{2}-\d{2}$/.test(orderDate));

// Test the payload structure
const testPayload = {
  shipments: [{
    name: "Test Customer",
    add: "Test Address",
    pin: "700001",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    phone: "9999999999",
    order: "TEST-ORDER-123",
    payment_mode: "COD",
    products_desc: "Test Product",
    hsn_code: "61091000",
    cod_amount: "100",
    order_date: orderDate,
    total_amount: "100",
    seller_add: "Test Seller Address",
    seller_name: "Test Seller",
    seller_inv: "INV-123",
    quantity: "1",
    weight: "500",
    shipment_width: "10",
    shipment_height: "10",
    shipment_length: "10",
    shipping_mode: "Surface",
    address_type: "home",
    fragile_shipment: false,
    dangerous_good: false,
    send_date: orderDate,
    end_date: estimatedDeliveryDate,
    invoice_no: "INV-123",
    shipment_type: "forward"
  }],
  pickup_location: {
    name: "Main Warehouse"
  }
};

console.log('\n=== Test Payload Structure ===');
console.log(JSON.stringify(testPayload, null, 2));
