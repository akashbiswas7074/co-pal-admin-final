#!/usr/bin/env node

/**
 * Test the updated shipment creation API endpoint
 */

import dotenv from 'dotenv';

dotenv.config();

async function testShipmentCreation() {
    console.log('=== Testing Updated Shipment Creation API ===');
    
    // Test with a real order ID from your database
    const testOrderId = '6779b3d9f61b21c5e2c234d8'; // Replace with a real order ID
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/shipments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: testOrderId,
                shipmentType: 'FORWARD',
                pickupLocation: 'Main Warehouse',
                shippingMode: 'Surface'
            }),
        });
        
        const data = await response.json();
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.success) {
            console.log('✅ SUCCESS! Shipment created successfully!');
            console.log('📋 Waybill:', data.waybill);
            console.log('🎉 The end_date error should be fixed now!');
        } else {
            console.log('❌ FAILED');
            console.log('Error:', data.error);
            
            // Check if it's still the end_date error
            if (data.error && data.error.includes('end_date')) {
                console.log('🔍 Still getting end_date error - need more investigation');
            } else {
                console.log('🎉 No more end_date error! Different error now (expected for invalid order).');
            }
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

console.log('Starting test...');
testShipmentCreation()
    .then(() => console.log('\nTest completed'))
    .catch(error => console.error('\nTest failed:', error));
