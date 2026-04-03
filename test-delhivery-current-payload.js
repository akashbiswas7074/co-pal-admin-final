#!/usr/bin/env node

/**
 * Test direct Delhivery API call with current payload structure
 */

import https from 'https';
import { URLSearchParams } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_API_URL = 'https://staging-express.delhivery.com/api/cmu/create.json';

async function testDelhiveryAPI() {
    const currentDate = new Date();
    const orderDate = currentDate.toISOString().split('T')[0];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];

    // Exact payload structure from our current implementation
    const payload = {
        shipments: [{
            name: "Test Customer",
            add: "Test Address, Test City",
            pin: "700001",
            city: "Kolkata",
            state: "West Bengal",
            country: "India",
            phone: "9999999999",
            order: "TEST-ORDER-" + Date.now(),
            payment_mode: "COD",
            return_pin: "700001",
            return_city: "Kolkata",
            return_phone: "9999999999",
            return_add: "Main Warehouse, Kolkata",
            return_state: "West Bengal",
            return_country: "India",
            products_desc: "Test Product",
            hsn_code: "61091000",
            cod_amount: "100",
            order_date: orderDate,
            total_amount: "100",
            seller_add: "Main Warehouse, Kolkata, West Bengal",
            seller_name: "Peeds",
            seller_inv: "INV-TEST-" + Date.now(),
            quantity: "1",
            waybill: "",
            shipment_width: "10",
            shipment_height: "10",
            shipment_length: "10",
            weight: "500",
            shipping_mode: "Surface",
            address_type: "home",
            fragile_shipment: false,
            dangerous_good: false,
            send_date: orderDate,
            end_date: estimatedDeliveryDate,
            ewaybill: "",
            invoice_no: "INV-TEST-" + Date.now(),
            shipment_type: "forward"
        }],
        pickup_location: {
            name: "Main Warehouse"
        }
    };

    console.log('=== Testing Delhivery API with Current Payload ===');
    console.log('API URL:', DELHIVERY_API_URL);
    console.log('Token configured:', DELHIVERY_TOKEN ? 'Yes' : 'No');
    console.log('Send Date:', orderDate);
    console.log('End Date:', estimatedDeliveryDate);
    console.log('');

    return new Promise((resolve, reject) => {
        const formData = new URLSearchParams();
        formData.append('format', 'json');
        formData.append('data', JSON.stringify(payload));

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
            timeout: 30000
        };

        console.log('Request Headers:');
        Object.keys(options.headers).forEach(key => {
            if (key === 'Authorization') {
                console.log(`  ${key}: Token ${DELHIVERY_TOKEN?.substring(0, 10)}...`);
            } else {
                console.log(`  ${key}: ${options.headers[key]}`);
            }
        });
        console.log('');

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response Status:', res.statusCode);
                console.log('Response Headers:', res.headers);
                console.log('Raw Response Body:', data);
                
                try {
                    const response = JSON.parse(data);
                    console.log('Parsed Response:', JSON.stringify(response, null, 2));
                    
                    if (response.success) {
                        console.log('✅ SUCCESS! Shipment created successfully!');
                        if (response.packages && response.packages.length > 0) {
                            console.log('📋 Waybill:', response.packages[0].waybill);
                        }
                    } else {
                        console.log('❌ FAILED! Error message:', response.rmk);
                        if (response.packages && response.packages.length > 0) {
                            const pkg = response.packages[0];
                            console.log('📋 Package Status:', pkg.status);
                            console.log('🔄 Serviceable:', pkg.serviceable);
                            console.log('📝 Remarks:', pkg.remarks);
                        }
                    }
                    
                    resolve(response);
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

        console.log('Sending request...');
        req.write(formData.toString());
        req.end();
    });
}

// Check if token is configured
if (!DELHIVERY_TOKEN) {
    console.error('❌ DELHIVERY_API_TOKEN not configured in .env file');
    process.exit(1);
}

// Run the test
testDelhiveryAPI()
    .then(() => {
        console.log('\n✅ Test completed successfully!');
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
