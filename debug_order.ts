const mongoose = require('mongoose');
const path = require('path');

// Configure Mongoose to use the project's models
const modelPath = path.join(__dirname, 'lib/database/models/order.model.ts');
const shipmentPath = path.join(__dirname, 'lib/database/models/shipment.model.ts');
const connectPath = path.join(__dirname, 'lib/database/connect.ts');

async function debugOrder() {
  try {
    // We'll just connect directly to the Mongo URL from the environment if possible
    // or try to import the connect function
    const { connectToDatabase } = require('./lib/database/connect');
    const Order = require('./lib/database/models/order.model').default;
    const Shipment = require('./lib/database/models/shipment.model').default;

    await connectToDatabase();
    console.log('--- DEBUG ORDER START ---');
    
    const orderId = '69cfa39b66a1c25300fe1256';
    const order = await Order.findById(orderId).lean();
    
    if (!order) {
      console.log('Order not found:', orderId);
      process.exit(0);
    }
    
    console.log('Order found:', {
      _id: order._id,
      hasOrderItems: !!order.orderItems,
      orderItemsCount: order.orderItems?.length,
      hasProducts: !!order.products,
      productsCount: order.products?.length,
      firstItem: order.orderItems?.[0] || order.products?.[0]
    });
    
    if (order.orderItems && order.orderItems.length > 0) {
      console.log('Order Items names:', order.orderItems.map(i => i.name));
    }
    
    const shipment = await Shipment.findOne({ orderId: orderId }).lean();
    if (shipment) {
      console.log('Shipment found for order:', {
        _id: shipment._id,
        waybill: shipment.primaryWaybill,
        packageDetails: shipment.packageDetails
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Debug script error:', err);
    process.exit(1);
  }
}

debugOrder();
