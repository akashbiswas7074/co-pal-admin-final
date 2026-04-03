#!/usr/bin/env node

/**
 * DELHIVERY COD SHIPMENT TEST - FIXED VERSION
 * ============================================
 * This test includes the required cod_amount field for COD orders
 */

import https from 'https';
import { URLSearchParams } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_API_URL = 'https://track.delhivery.com/api/cmu/create.json';
const WAREHOUSE_NAME = 'Main Warehouse';

console.log(`
🚀 Fixed Delhivery COD Shipment Test
📍 API URL: ${DELHIVERY_API_URL}
🔐 Token configured: ${DELHIVERY_TOKEN ? 'Yes' : 'No'}
🏭 Warehouse: ${WAREHOUSE_NAME}

🧪 Starting Fixed COD Test...
`);

// Test function with proper error handling
function testDelhiveryShipment() {
    return new Promise((resolve, reject) => {
        const orderId = `TEST_COD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // FIXED: Added cod_amount field for COD orders
        const shipmentData = {
            shipments: [
                {
                    name: "John Doe",
                    add: "123 Main Street, New Delhi, Delhi",
                    pin: "110001",
                    city: "New Delhi",
                    state: "Delhi",
                    country: "India",
                    phone: "9876543210",
                    order: orderId,
                    payment_mode: "COD",
                    cod_amount: "999",  // 🔑 CRITICAL: Added COD amount
                    products_desc: "Test Product - Mobile Phone",
                    weight: "500",
                    quantity: "1",
                    hsn_code: "8517",  // Added HSN code for mobile phone
                    seller_name: "Peeds Paul & Co",
                    seller_add: "Seller Address, New Delhi",
                    seller_cst: "07AAAAA0000A1Z5",
                    total_amount: "999",
                    invoice_amount: "999"
                }
            ],
            pickup_location: {
                name: WAREHOUSE_NAME
            }
        };

        console.log(`📦 Order ID: ${orderId}`);
        console.log(`💰 COD Amount: ₹999`);
        console.log(`📄 Payload with COD amount:`, JSON.stringify(shipmentData, null, 2));

        const postData = new URLSearchParams();
        postData.append('format', 'json');
        postData.append('data', JSON.stringify(shipmentData));

        const options = {
            hostname: 'track.delhivery.com',
            port: 443,
            path: '/api/cmu/create.json',
            method: 'POST',
            headers: {
                'Authorization': `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData.toString()),
                'Accept': 'application/json'
            },
            timeout: 30000
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`📊 Response Status: ${res.statusCode}`);
                    console.log(`📄 Full Response:`, JSON.stringify(response, null, 2));
                    
                    if (response.success) {
                        console.log(`✅ SUCCESS! Shipment created successfully!`);
                        console.log(`📋 Waybill: ${response.packages[0]?.waybill}`);
                        console.log(`📦 Status: ${response.packages[0]?.status}`);
                        resolve(response);
                    } else {
                        console.log(`⚠️  API returned success: false`);
                        console.log(`📝 Error message: ${response.rmk || 'No specific error'}`);
                        
                        if (response.packages && response.packages.length > 0) {
                            console.log(`📋 Package Status: ${response.packages[0].status}`);
                            console.log(`📝 Remarks: ${response.packages[0].remarks ? response.packages[0].remarks.join(', ') : 'None'}`);
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

        req.write(postData.toString());
        req.end();
    });
}

// Run the test
async function runTest() {
    try {
        if (!DELHIVERY_TOKEN) {
            console.error('❌ DELHIVERY_API_TOKEN not found in environment variables');
            process.exit(1);
        }

        const result = await testDelhiveryShipment();
        
        console.log(`\n📋 Test Summary:`);
        console.log(`================`);
        
        if (result.success) {
            console.log(`✅ Test PASSED - COD shipment created successfully!`);
            console.log(`🎉 Waybill generated: ${result.packages[0]?.waybill}`);
            console.log(`📦 Package status: ${result.packages[0]?.status}`);
            console.log(`💰 COD amount: ₹${result.packages[0]?.cod_amount}`);
        } else {
            console.log(`⚠️  Test FAILED - COD amount issue may be resolved, but other issues remain`);
            console.log(`🔧 Check remarks for specific issues:`);
            
            if (result.packages && result.packages.length > 0) {
                const pkg = result.packages[0];
                console.log(`   - Status: ${pkg.status}`);
                console.log(`   - Serviceable: ${pkg.serviceable}`);
                console.log(`   - Remarks: ${pkg.remarks ? pkg.remarks.join(', ') : 'None'}`);
                
                if (pkg.remarks && pkg.remarks.length > 0) {
                    console.log(`\n🔍 Detailed Analysis:`);
                    pkg.remarks.forEach((remark, index) => {
                        console.log(`   ${index + 1}. ${remark}`);
                        
                        if (remark.includes('COD amount')) {
                            console.log(`      ✅ COD amount is now included in payload`);
                        } else if (remark.includes('serviceable')) {
                            console.log(`      ⚠️  Serviceability issue - check pincode coverage`);
                        } else if (remark.includes('warehouse')) {
                            console.log(`      ⚠️  Warehouse issue - verify registration`);
                        }
                    });
                }
            }
        }
        
        console.log(`\n🎯 Next Steps:`);
        console.log(`==============`);
        
        if (result.success) {
            console.log(`✅ COD integration is working! You can now:`);
            console.log(`   1. Test with different COD amounts`);
            console.log(`   2. Test with Prepaid orders`);
            console.log(`   3. Integrate into your main application`);
        } else {
            console.log(`🔧 Issues to resolve:`);
            console.log(`   1. Verify warehouse "Main Warehouse" is registered`);
            console.log(`   2. Check if your location is serviceable`);
            console.log(`   3. Verify API token permissions`);
            console.log(`   4. Contact Delhivery support if needed`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

// Run the test
runTest();
