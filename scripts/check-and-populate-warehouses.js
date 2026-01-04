// Script to check and populate MongoDB warehouses
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/ecommerce-admin';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registered_name: String,
  phone: { type: String, required: true },
  email: String,
  address: String,
  city: String,
  pin: { type: String, required: true },
  country: String,
  return_address: { type: String, required: true },
  return_city: String,
  return_pin: String,
  return_state: String,
  return_country: String,
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  delhiveryResponse: Object,
  createdBy: String,
  vendorId: String,
  isDefault: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Warehouse = mongoose.model('Warehouse', WarehouseSchema);

const checkAndPopulateWarehouses = async () => {
  console.log('🔍 Checking MongoDB warehouses...');
  
  try {
    // Check existing warehouses
    const existingWarehouses = await Warehouse.find({});
    console.log(`📦 Found ${existingWarehouses.length} existing warehouses`);
    
    if (existingWarehouses.length > 0) {
      console.log('🏭 Existing warehouses:');
      existingWarehouses.forEach((warehouse, index) => {
        console.log(`   [${index + 1}] ${warehouse.name} - ${warehouse.city}, ${warehouse.pin} (Status: ${warehouse.status})`);
      });
    }
    
    // If no active warehouses, create default ones
    const activeWarehouses = await Warehouse.find({ status: 'active' });
    if (activeWarehouses.length === 0) {
      console.log('📦 No active warehouses found, creating default warehouses...');
      
      const defaultWarehouses = [
        {
          name: 'Main Warehouse',
          registered_name: 'Main Warehouse Center',
          phone: '+919876543210',
          email: 'warehouse@copal.com',
          address: 'A-Block, Phase I, Kalyani Township, Near Kalyani University',
          city: 'Kalyani',
          pin: '741235',
          country: 'India',
          return_address: 'A-Block, Phase I, Kalyani Township, Near Kalyani University',
          return_city: 'Kalyani',
          return_pin: '741235',
          return_state: 'West Bengal',
          return_country: 'India',
          status: 'active',
          isDefault: true
        },
        {
          name: 'Delhi Hub',
          registered_name: 'Delhi Distribution Hub',
          phone: '+919876543211',
          email: 'delhi@copal.com',
          address: 'Plot No. 123, Sector 63, Noida, Near Metro Station',
          city: 'Noida',
          pin: '201301',
          country: 'India',
          return_address: 'Plot No. 123, Sector 63, Noida, Near Metro Station',
          return_city: 'Noida',
          return_pin: '201301',
          return_state: 'Uttar Pradesh',
          return_country: 'India',
          status: 'active',
          isDefault: false
        },
        {
          name: 'Mumbai Hub',
          registered_name: 'Mumbai Distribution Center',
          phone: '+919876543212',
          email: 'mumbai@copal.com',
          address: 'Unit 45, Industrial Estate, Andheri East, Near Airport',
          city: 'Mumbai',
          pin: '400069',
          country: 'India',
          return_address: 'Unit 45, Industrial Estate, Andheri East, Near Airport',
          return_city: 'Mumbai',
          return_pin: '400069',
          return_state: 'Maharashtra',
          return_country: 'India',
          status: 'active',
          isDefault: false
        }
      ];
      
      for (const warehouseData of defaultWarehouses) {
        const warehouse = new Warehouse(warehouseData);
        await warehouse.save();
        console.log(`✅ Created warehouse: ${warehouse.name}`);
      }
      
      console.log('🎉 Default warehouses created successfully!');
    }
    
    // Show final count
    const finalCount = await Warehouse.countDocuments({ status: 'active' });
    console.log(`📊 Total active warehouses: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkAndPopulateWarehouses();
  mongoose.connection.close();
  console.log('✅ Done');
};

if (require.main === module) {
  main();
}

module.exports = { checkAndPopulateWarehouses };
