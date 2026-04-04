const mongoose = require('mongoose');

// Need to define a generic Order schema to bypass Mongoose model cache issues in standalone scripts
const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function run() {
  await mongoose.connect('mongodb://admin:admin123@91.108.111.4:27017/ecomarcedb?authSource=admin');
  
  const virtualOrderQuery = {
    $or: [
      { shipmentCreated: true },
      { 'orderItems.waybillNumber': { $exists: true, $ne: null } },
      { 'products.waybillNumber': { $exists: true, $ne: null } },
      { 'orderItems.status': 'Dispatched' },
      { 'products.status': 'Dispatched' }
    ]
  };
  
  const orders = await Order.find(virtualOrderQuery).lean();
  console.log(`Found ${orders.length} dispatched orders.`);
  
  const target = orders.find(o => o._id.toString() === '69d0facd716655ed9118e211');
  if (target) {
    console.log("SUCCESS! Target order IS found by the query.");
    console.log("Status:", target.status);
    console.log("OrderItems:", target.orderItems?.map(i => i.status));
  } else {
    console.log("Target order NOT found by the query!");
  }
  
  await mongoose.connection.close();
}
run();
