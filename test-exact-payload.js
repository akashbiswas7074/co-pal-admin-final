#!/usr/bin/env node

/**
 * Direct test of the exact payload that was failing
 */

import https from 'https';
import { URLSearchParams } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_API_URL = 'https://track.delhivery.com/api/cmu/create.json';

async function testExactPayload() {
    // The exact payload from the logs that was failing
    const payload = {
        "shipments": [
            {
                "name": "Akash Biswas",
                "add": "A11 577, n",
                "pin": "741235",
                "city": "kalyani",
                "state": "Madhya Pradesh",
                "country": "India",
                "phone": "9051617498",
                "order": "TEST_" + Date.now(),
                "payment_mode": "COD",
                "return_pin": "700001",
                "return_city": "Kolkata",
                "return_phone": "9999999999",
                "return_add": "Main Warehouse, Kolkata",
                "return_state": "West Bengal",
                "return_country": "India",
                "products_desc": "Test Product",
                "hsn_code": "61091000",
                "cod_amount": "123.40", // Fixed floating point
                "order_date": "2025-07-09",
                "total_amount": "123.40", // Fixed floating point
                "seller_add": "Main Warehouse, Kolkata, West Bengal",
                "seller_name": "Peeds",
                "seller_inv": "INV-TEST-" + Date.now(),
                "quantity": "1",
                "shipment_width": "10",
                "shipment_height": "10",
                "shipment_length": "10",
                "weight": "500",
                "shipping_mode": "Surface",
                "address_type": "home",
                "fragile_shipment": false,
                "dangerous_good": false,
                "send_date": "2025-07-09",
                "end_date": "2025-07-16",
                "ewaybill": "",
                "invoice_no": "INV-TEST-" + Date.now(),
                "shipment_type": "forward",
                "invoice_amount": "123.40" // Fixed floating point
            }
        ],
        "pickup_location": {
            "name": "Main Warehouse"
        }
    };

    console.log('=== Testing Exact Payload with Fixed Amounts ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    return new Promise((resolve, reject) => {
        const formData = new URLSearchParams();
        formData.append('format', 'json');
        formData.append('data', JSON.stringify(payload));

        const options = {
            hostname: 'track.delhivery.com',
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
                    console.log('Response:', JSON.stringify(response, null, 2));
                    
                    if (response.success) {
                        console.log('✅ SUCCESS! Shipment created successfully!');
                        if (response.packages && response.packages.length > 0) {
                            console.log('📋 Waybill:', response.packages[0].waybill);
                        }
                    } else {
                        console.log('❌ FAILED');
                        console.log('Error:', response.rmk);
                        
                        if (response.rmk && response.rmk.includes('end_date')) {
                            console.log('🔍 Still getting end_date error');
                        } else {
                            console.log('🎉 No more end_date error! Different error now.');
                        }
                        
                        if (response.packages && response.packages.length > 0) {
                            console.log('Package details:', response.packages[0]);
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

        req.write(formData.toString());
        req.end();
    });
}

if (!DELHIVERY_TOKEN) {
    console.error('❌ DELHIVERY_API_TOKEN not configured');
    process.exit(1);
}

testExactPayload()
    .then(() => console.log('\nTest completed'))
    .catch(error => console.error('\nTest failed:', error));
