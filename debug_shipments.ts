import { connectToDatabase } from './lib/database/connect';
import Shipment from './lib/database/models/shipment.model';

async function run() {
  await connectToDatabase();
  const allShipments = await Shipment.find({}).lean();
  console.log("Total shipments in DB:", allShipments.length);
  allShipments.forEach(s => {
    console.log(`- ID: ${s._id} | Waybill: ${s.primaryWaybill} | Status: ${s.status} | Order: ${s.orderId}`);
  });
  process.exit(0);
}
run();
