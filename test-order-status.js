// Test script to check order statuses in the database
import { connectToDatabase } from './lib/database/connect.js';
import Order from './lib/database/models/order.model.js';

async function checkOrderStatuses() {
  try {
    await connectToDatabase();
    
    // Get unique status values from the database
    const statuses = await Order.distinct('status');
    console.log('Unique status values in database:', statuses);
    
    // Get sample orders with their statuses
    const sampleOrders = await Order.find({})
      .select('_id status createdAt')
      .limit(10)
      .sort({ createdAt: -1 });
    
    console.log('\nSample orders:');
    sampleOrders.forEach(order => {
      console.log(`Order ${order._id.toString().slice(-8)}: "${order.status}"`);
    });
    
    // Count orders by status
    console.log('\nOrder counts by status:');
    for (const status of statuses) {
      const count = await Order.countDocuments({ status });
      console.log(`${status}: ${count} orders`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkOrderStatuses();
