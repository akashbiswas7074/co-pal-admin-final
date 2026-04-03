#!/usr/bin/env node

/**
 * DELHIVERY API TEST WITH REQUIRED FIELDS
 * Based on the error message, we need to add the missing fields
 */

import https from 'https';
import { URLSearchParams } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_API_URL = 'https://staging-express.delhivery.com/api/cmu/create.json';

async function testWithRequiredFields() {
    const orderId = `TEST_REQUIRED_${Date.now()}`;
    
    // Current date for send_date
    const currentDate = new Date();
    const orderDate = currentDate.toISOString().split('T')[0];
    
    // Estimated delivery date (7 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];
    
    // Payload with required date fields
    const shipmentData = {
        shipments: [
            {
                name: "Test Customer",
                add: "123 Test Street, Test City",
                pin: "700001",
                city: "Kolkata",
                state: "West Bengal",
                country: "India",
                phone: "9999999999",
                order: orderId,
                payment_mode: "COD",
                cod_amount: "100",
                products_desc: "Test Product",
                weight: "500",
                quantity: "1",
                hsn_code: "61091000",
                seller_name: "Peeds",
                seller_add: "Test Seller Address",
                total_amount: "100",
                invoice_amount: "100",
                // Add the required date fields
                order_date: orderDate,
                send_date: orderDate,
                end_date: estimatedDeliveryDate,
                // Add other potentially required fields
                return_pin: "700001",
                return_city: "Kolkata",
                return_state: "West Bengal",
                return_country: "India",
                return_add: "Main Warehouse",
                return_phone: "9999999999",
                seller_inv: `INV-${orderId}`,
                invoice_no: `INV-${orderId}`,
                ewaybill: "",
                shipment_type: "forward",
                shipping_mode: "Surface",
                shipment_width: "10",
                shipment_height: "10",
                shipment_length: "10",
                address_type: "home",
                fragile_shipment: false,
                dangerous_good: false
            }
        ],
        pickup_location: {
            name: "Main Warehouse"
        }
    };

    console.log('=== Testing Delhivery API with Required Fields ===');
    console.log('Order ID:', orderId);
    console.log('Send Date:', orderDate);
    console.log('End Date:', estimatedDeliveryDate);
    console.log('Payload:', JSON.stringify(shipmentData, null, 2));
    console.log('');

    return new Promise((resolve, reject) => {
        const formData = new URLSearchParams();
        formData.append('format', 'json');
        formData.append('data', JSON.stringify(shipmentData));

        const options = {
            hostname: 'staging-express.delhivery.com',
            port: 443,
            path: '/api/cmu/create.json',
            method: 'POST',
            headers: {
                'Authorization': `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formData.toString()),
                'Accept': 'application/json'
            },
            timeout: 15000
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response Status:', res.statusCode);
                
                try {
                    const response = JSON.parse(data);
                    console.log('Parsed Response:', JSON.stringify(response, null, 2));
                    
                    if (response.success) {
                        console.log('✅ SUCCESS! Shipment created with required fields!');
                        if (response.packages && response.packages.length > 0) {
                            console.log('📋 Waybill:', response.packages[0].waybill);
                        }
                        resolve(response);
                    } else {
                        console.log('❌ FAILED');
                        console.log('Error:', response.rmk);
                        
                        // Check if it's still the end_date error
                        if (response.rmk && response.rmk.includes('end_date')) {
                            console.log('🔍 Still getting end_date error - may be a different issue');
                        } else {
                            console.log('🎉 No more end_date error! Different error now.');
                        }
                        
                        if (response.packages && response.packages.length > 0) {
                            const pkg = response.packages[0];
                            console.log('Package Status:', pkg.status);
                            console.log('Serviceable:', pkg.serviceable);
                            console.log('Remarks:', pkg.remarks);
                        }
                        
                        resolve(response);
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    console.error('Raw response:', data);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.on('timeout', () => {
            console.error('❌ Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(formData.toString());
        req.end();
    });
}

if (!DELHIVERY_TOKEN) {
    console.error('❌ DELHIVERY_API_TOKEN not configured');
    process.exit(1);
}

testWithRequiredFields()
    .then(() => console.log('\nTest completed'))
    .catch(error => console.error('\nTest failed:', error));
