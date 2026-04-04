import { connectToDatabase } from './lib/database/connect';
import mongoose from 'mongoose';

async function run() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  const shipments = await db.collection('shipments').find({ orderId: new mongoose.Types.ObjectId('69d0facd716655ed9118e211') }).toArray();
  console.log(`Found ${shipments.length} shipments for order 9118e211`);
  shipments.forEach(s => {
    console.log(`- ID: ${s._id} | PrimaryWaybill: ${s.primaryWaybill} | Waybills: ${JSON.stringify(s.waybillNumbers)}`);
  });
  process.exit(0);
}
run();
