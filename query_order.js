const mongoose = require('mongoose');
const Order = require('./lib/database/models/order.model').default;

mongoose.connect('mongodb://admin:admin123@91.108.111.4:27017/ecomarcedb?authSource=admin').then(async () => {
  const order = await Order.findById('69d0facd716655ed9118e211').lean();
  console.log("Order Status:", order.status);
  console.log("Order shipmentCreated:", order.shipmentCreated);
  console.log("Shipping Address:", order.shippingAddress);
  console.log("Delivery Address:", order.deliveryAddress);
  process.exit(0);
});
