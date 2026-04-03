// Warehouse Setup Script for Testing
// Run this script to add test warehouse data to your database

const mongoose = require('mongoose');

// MongoDB connection (update with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Akashbiswas7797:Akashbiswas7797@cluster0.obj5h.mongodb.net/vibecart?retryWrites=true&w=majority';

// Warehouse Schema (should match your existing schema)
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pin: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, default: 'India' },
  registered_name: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  return_pin: { type: String },
  return_city: { type: String },
  return_address: { type: String },
  return_state: { type: String },
  return_country: { type: String },
  return_phone: { type: String }
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

// Sample warehouse data
const sampleWarehouses = [
  {
    name: 'Akash',
    address: 'A11 577, Block A, Sector 1',
    city: 'Kalyani',
    state: 'West Bengal',
    pin: '741235',
    phone: '9051617498',
    country: 'India',
    registered_name: 'Akash Biswas',
    status: 'active',
    return_pin: '741235',
    return_city: 'Kalyani',
    return_address: 'A11 577, Block A, Sector 1',
    return_state: 'West Bengal',
    return_country: 'India',
    return_phone: '9051617498'
  },
  {
    name: 'Main Warehouse',
    address: '123 Business Park, Salt Lake',
    city: 'Kolkata',
    state: 'West Bengal',
    pin: '700091',
    phone: '9876543210',
    country: 'India',
    registered_name: 'VibeCart Pvt Ltd',
    status: 'active',
    return_pin: '700091',
    return_city: 'Kolkata',
    return_address: '123 Business Park, Salt Lake',
    return_state: 'West Bengal',
    return_country: 'India',
    return_phone: '9876543210'
  },
  {
    name: 'Delhi Hub',
    address: '456 Industrial Area, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    pin: '122001',
    phone: '9123456789',
    country: 'India',
    registered_name: 'VibeCart North',
    status: 'active',
    return_pin: '122001',
    return_city: 'Gurgaon',
    return_address: '456 Industrial Area, Gurgaon',
    return_state: 'Haryana',
    return_country: 'India',
    return_phone: '9123456789'
  }
];

async function setupWarehouses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if warehouses already exist
    const existingWarehouses = await Warehouse.find({});
    
    if (existingWarehouses.length > 0) {
      console.log('Warehouses already exist:');
      existingWarehouses.forEach(warehouse => {
        console.log(`- ${warehouse.name} (${warehouse.city}, ${warehouse.state})`);
      });
      
      // Update existing warehouses if needed
      for (const sampleWarehouse of sampleWarehouses) {
        const existing = await Warehouse.findOne({ name: sampleWarehouse.name });
        if (existing) {
          await Warehouse.updateOne({ _id: existing._id }, sampleWarehouse);
          console.log(`Updated warehouse: ${sampleWarehouse.name}`);
        } else {
          await Warehouse.create(sampleWarehouse);
          console.log(`Created new warehouse: ${sampleWarehouse.name}`);
        }
      }
    } else {
      // Create all sample warehouses
      await Warehouse.insertMany(sampleWarehouses);
      console.log('Created sample warehouses:');
      sampleWarehouses.forEach(warehouse => {
        console.log(`- ${warehouse.name} (${warehouse.city}, ${warehouse.state})`);
      });
    }

    console.log('Warehouse setup completed successfully!');
  } catch (error) {
    console.error('Error setting up warehouses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupWarehouses();

module.exports = { setupWarehouses, sampleWarehouses };
