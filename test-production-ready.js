#!/usr/bin/env node

/**
 * PRODUCTION-READY DELHIVERY TEST WITH REALISTIC DATA
 * ===================================================
 * Use this test after adding funds to your Delhivery account
 */

import https from 'https';
import { URLSearchParams } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_API_URL = 'https://track.delhivery.com/api/cmu/create.json';
const WAREHOUSE_NAME = 'Main Warehouse';

console.log(`
🚀 Production-Ready Delhivery Test
📍 API URL: ${DELHIVERY_API_URL}
🔐 Token configured: ${DELHIVERY_TOKEN ? 'Yes' : 'No'}
🏭 Warehouse: ${WAREHOUSE_NAME}

⚡ Starting Production Tests with Realistic Data...
`);

// Realistic test data
const realisticCustomers = [
    {
        name: "Rajesh Kumar",
        add: "A-245, Sector 12, Noida, Uttar Pradesh",
        pin: "201301",
        city: "Noida",
        state: "Uttar Pradesh",
        phone: "9876543210"
    },
    {
        name: "Priya Sharma",
        add: "B-78, Janakpuri, New Delhi",
        pin: "110058",
        city: "New Delhi", 
        state: "Delhi",
        phone: "9876543211"
    },
    {
        name: "Amit Patel",
        add: "C-142, Satellite, Ahmedabad, Gujarat",
        pin: "380015",
        city: "Ahmedabad",
        state: "Gujarat", 
        phone: "9876543212"
    }
];

const realisticProducts = [
    {
        desc: "Samsung Galaxy Mobile Phone",
        weight: "200",
        amount: "15999",
        hsn: "8517"
    },
    {
        desc: "Nike Running Shoes",
        weight: "800",
        amount: "7999",
        hsn: "6403"
    },
    {
        desc: "Laptop Bag - Waterproof",
        weight: "500",
        amount: "2999",
        hsn: "4202"
    }
];

async function testProductionShipment(testType, paymentMode, customer, product) {
    return new Promise((resolve, reject) => {
        const orderId = `${testType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const shipmentData = {
            shipments: [
                {
                    name: customer.name,
                    add: customer.add,
                    pin: customer.pin,
                    city: customer.city,
                    state: customer.state,
                    country: "India",
                    phone: customer.phone,
                    order: orderId,
                    payment_mode: paymentMode,
                    products_desc: product.desc,
                    weight: product.weight,
                    quantity: "1",
                    hsn_code: product.hsn,
                    total_amount: product.amount,
                    invoice_amount: product.amount,
                    seller_name: "Peeds Paul & Co",
                    seller_add: "Shop 123, Main Market, New Delhi",
                    seller_cst: "07AAAAA0000A1Z5",
                    // Add COD amount only for COD orders
                    ...(paymentMode === 'COD' && { cod_amount: product.amount })
                }
            ],
            pickup_location: {
                name: WAREHOUSE_NAME
            }
        };

        console.log(`🔄 Testing: ${testType} - ${paymentMode}`);
        console.log(`👤 Customer: ${customer.name}`);
        console.log(`📦 Product: ${product.desc}`);
        console.log(`💰 Amount: ₹${product.amount}`);
        console.log(`📍 Delivery: ${customer.city}, ${customer.state}`);

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
                    
                    if (response.success) {
                        console.log(`✅ SUCCESS! Shipment created successfully!`);
                        console.log(`📋 Waybill: ${response.packages[0]?.waybill}`);
                        console.log(`📦 Status: ${response.packages[0]?.status}`);
                        console.log(`💰 COD Amount: ₹${response.packages[0]?.cod_amount || 0}`);
                        console.log(`🔄 Serviceable: ${response.packages[0]?.serviceable}`);
                    } else {
                        console.log(`⚠️  Shipment failed`);
                        console.log(`📝 Error: ${response.rmk}`);
                        
                        if (response.packages && response.packages.length > 0) {
                            const pkg = response.packages[0];
                            console.log(`📋 Package Status: ${pkg.status}`);
                            console.log(`🔄 Serviceable: ${pkg.serviceable}`);
                            console.log(`📝 Remarks: ${pkg.remarks ? pkg.remarks.join(', ') : 'None'}`);
                            
                            // Check for specific error types
                            if (pkg.remarks) {
                                pkg.remarks.forEach(remark => {
                                    if (remark.includes('insufficient balance')) {
                                        console.log(`💰 ACTION REQUIRED: Add funds to Delhivery account`);
                                    } else if (remark.includes('suspicious')) {
                                        console.log(`🛡️  SECURITY CHECK: Contact Delhivery support`);
                                    }
                                });
                            }
                        }
                    }
                    
                    console.log(''); // Empty line for spacing
                    resolve(response);
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
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

async function runProductionTests() {
    if (!DELHIVERY_TOKEN) {
        console.error('❌ DELHIVERY_API_TOKEN not found in environment variables');
        process.exit(1);
    }

    const testResults = [];
    
    try {
        // Test 1: COD with realistic data
        console.log('🎯 TEST 1: COD Order with Realistic Data');
        console.log('==========================================');
        const codResult = await testProductionShipment(
            'PROD_COD',
            'COD',
            realisticCustomers[0],
            realisticProducts[0]
        );
        testResults.push({ test: 'COD', success: codResult.success });

        // Test 2: Prepaid with realistic data
        console.log('🎯 TEST 2: Prepaid Order with Realistic Data');
        console.log('=============================================');
        const prepaidResult = await testProductionShipment(
            'PROD_PREPAID',
            'Pre-paid',
            realisticCustomers[1],
            realisticProducts[1]
        );
        testResults.push({ test: 'Prepaid', success: prepaidResult.success });

        // Test 3: Another COD with different customer
        console.log('🎯 TEST 3: COD Order - Different Customer');
        console.log('==========================================');
        const cod2Result = await testProductionShipment(
            'PROD_COD2',
            'COD',
            realisticCustomers[2],
            realisticProducts[2]
        );
        testResults.push({ test: 'COD2', success: cod2Result.success });

        // Summary
        console.log('📊 PRODUCTION TEST RESULTS:');
        console.log('============================');
        
        let successCount = 0;
        testResults.forEach(result => {
            const status = result.success ? '✅ PASSED' : '❌ FAILED';
            console.log(`${status} ${result.test}`);
            if (result.success) successCount++;
        });
        
        console.log(`\n🎯 Success Rate: ${successCount}/${testResults.length} tests passed`);
        
        if (successCount === testResults.length) {
            console.log(`\n🎉 CONGRATULATIONS! All production tests passed!`);
            console.log(`✅ Your Delhivery integration is fully operational!`);
            console.log(`🚀 Ready for production deployment!`);
        } else {
            console.log(`\n⚠️  Some tests failed. Check the error messages above.`);
            console.log(`💰 Most likely cause: Insufficient balance in Delhivery account`);
            console.log(`📞 Contact Delhivery support if balance is sufficient`);
        }
        
    } catch (error) {
        console.error('❌ Production test failed:', error);
        process.exit(1);
    }
}

// Run the production tests
runProductionTests();
