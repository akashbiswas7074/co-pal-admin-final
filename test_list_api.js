const mongoose = require('mongoose');
const Order = require('./lib/database/models/order.model').default;

async function run() {
  await mongoose.connect('mongodb://admin:admin123@91.108.111.4:27017/ecomarcedb?authSource=admin');
  
  const query = {
    $or: [
      { shipmentCreated: true },
      { status: 'Dispatched' },
      { 'orderItems.status': 'Dispatched' },
      { 'products.status': 'Dispatched' },
      { 'orderItems.waybillNumber': { $exists: true, $ne: null } },
      { 'products.waybillNumber': { $exists: true, $ne: null } },
      { reverseShipment: { $exists: true } },
      { replacementShipment: { $exists: true } }
    ]
  };
  
  const orders = await Order.find(query)
    .select('_id status orderItems.status products.status waybillNumbers')
    .lean();
    
  console.log("Orders found matching shipment query:");
  console.log(JSON.stringify(orders.map(o => ({
    _id: o._id,
    status: o.status,
    itemCount: o.orderItems?.length || o.products?.length || 0,
    hasDispatchedItem: (o.orderItems || []).some(i => i.status === 'Dispatched') || (o.products || []).some(i => i.status === 'Dispatched')
  })), null, 2));
  
  mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
