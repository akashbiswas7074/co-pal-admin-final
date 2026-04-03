const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkOrderData() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');
        
        const client = new MongoClient(uri, {
            useUnifiedTopology: true
        });
        await client.connect();
        
        const db = client.db();
        const order = await db.collection('orders').findOne({
            _id: require('mongodb').ObjectId('6866292b2f9cae2845841144')
        });
        
        if (order) {
            console.log('\n📋 Order Data Analysis:');
            console.log('='.repeat(50));
            console.log('Order ID:', order._id);
            console.log('Customer Name:', order.customerInfo?.name || 'MISSING');
            console.log('Address:', order.customerInfo?.address || 'MISSING');
            console.log('City:', order.customerInfo?.city || 'MISSING');
            console.log('State:', order.customerInfo?.state || 'MISSING');
            console.log('Pincode:', order.customerInfo?.pincode || 'MISSING');
            console.log('Phone:', order.customerInfo?.phone || 'MISSING');
            console.log('Products:', order.products?.map(p => p.name || p.title) || 'MISSING');
            
            console.log('\n🔍 Data Quality Check:');
            console.log('='.repeat(50));
            
            // Check address quality
            const address = order.customerInfo?.address || '';
            if (address.length < 10) {
                console.log('❌ Address too short:', address);
            } else if (address.includes('n') && address.length < 15) {
                console.log('❌ Address seems incomplete:', address);
            } else {
                console.log('✅ Address seems valid:', address);
            }
            
            // Check phone quality
            const phone = order.customerInfo?.phone || '';
            if (phone.length < 10) {
                console.log('❌ Phone too short:', phone);
            } else {
                console.log('✅ Phone seems valid:', phone);
            }
            
            // Check product names
            const products = order.products || [];
            products.forEach((product, index) => {
                const name = product.name || product.title || '';
                if (name.length < 5) {
                    console.log(`❌ Product ${index + 1} name too short:`, name);
                } else if (name.includes('77777')) {
                    console.log(`❌ Product ${index + 1} name seems like garbage:`, name);
                } else {
                    console.log(`✅ Product ${index + 1} name seems valid:`, name);
                }
            });
            
        } else {
            console.log('❌ Order not found!');
        }
        
        await client.close();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrderData();
