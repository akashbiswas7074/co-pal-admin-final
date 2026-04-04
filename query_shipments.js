const mongoose = require('mongoose');
const Order = require('./lib/database/models/order.model').default;

mongoose.connect('mongodb://admin:admin123@91.108.111.4:27017/ecomarcedb?authSource=admin').then(async () => {
  const count = await Order.countDocuments({
    $or: [
      { shipmentCreated: true },
      { reverseShipment: { $exists: true } },
      { replacementShipment: { $exists: true } }
    ]
  });
  console.log("Total orders with shipments:", count);
  
  const allOrdersCount = await Order.countDocuments({});
  console.log("Total orders:", allOrdersCount);
  
  const dispatchedOrders = await Order.countDocuments({ status: 'Dispatched' });
  console.log("Dispatched orders (might be partial/full):", dispatchedOrders);
  
  process.exit(0);
});
