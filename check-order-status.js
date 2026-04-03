#!/usr/bin/env node

// Check order status
require('dotenv').config();
const mongoose = require('mongoose');

async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
  }
}

const OrderSchema = new mongoose.Schema({}, { collection: 'orders', strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function checkOrderStatus() {
  try {
    console.log('Checking order status...');
    await connectToDatabase();
    
    const orderId = '6866292b2f9cae2845841144';
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('Order not found');
      return;
    }
    
    console.log('Order found:');
    console.log('- ID:', order._id);
    console.log('- Status:', order.status);
    console.log('- Payment Method:', order.paymentMethod);
    console.log('- Total Amount:', order.totalAmount);
    console.log('- Customer:', order.customerName || order.user?.name);
    console.log('- Shipment Created:', order.shipmentCreated);
    console.log('- Created At:', order.createdAt);
    
    // Update order status to allow shipment creation
    if (!['Confirmed', 'Processing'].includes(order.status)) {
      console.log(`\nUpdating order status from '${order.status}' to 'Confirmed'...`);
      await Order.findByIdAndUpdate(orderId, { status: 'Confirmed' });
      console.log('Order status updated successfully!');
    } else {
      console.log('Order status is already valid for shipment creation');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrderStatus();
