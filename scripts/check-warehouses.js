#!/usr/bin/env node

// Simple script to check and seed warehouses
const mongoose = require('mongoose');

// Database connection
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
  }
}

// Warehouse Schema
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registered_name: String,
  phone: { type: String, required: true },
  email: String,
  address: String,
  city: String,
  pin: { type: String, required: true },
  country: { type: String, default: 'India' },
  return_address: { type: String, required: true },
  return_city: String,
  return_pin: String,
  return_state: String,
  return_country: String,
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WarehouseModel = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);

async function checkAndSeedWarehouses() {
  try {
    console.log('Starting warehouse check...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await connectToDatabase();
    console.log('Connected to database');
    
    // Check if there are any warehouses
    const warehouseCount = await WarehouseModel.countDocuments();
    console.log(`Found ${warehouseCount} warehouses in database`);
    
    if (warehouseCount === 0) {
      console.log('No warehouses found. Creating sample warehouses...');
      
      const sampleWarehouses = [
        {
          name: 'Main Warehouse',
          registered_name: 'Main Warehouse Pvt Ltd',
          phone: '+919876543210',
          email: 'warehouse@company.com',
          address: '123 Industrial Area, Sector 1',
          city: 'Mumbai',
          pin: '400001',
          country: 'India',
          return_address: '123 Industrial Area, Sector 1',
          return_city: 'Mumbai',
          return_pin: '400001',
          return_state: 'Maharashtra',
          return_country: 'India',
          status: 'active',
          isDefault: true
        },
        {
          name: 'Delhi Hub',
          registered_name: 'Delhi Hub Pvt Ltd',
          phone: '+919876543211',
          email: 'delhi@company.com',
          address: '456 Commerce Street, Block A',
          city: 'Delhi',
          pin: '110001',
          country: 'India',
          return_address: '456 Commerce Street, Block A',
          return_city: 'Delhi',
          return_pin: '110001',
          return_state: 'Delhi',
          return_country: 'India',
          status: 'active',
          isDefault: false
        }
      ];
      
      await WarehouseModel.insertMany(sampleWarehouses);
      console.log('Sample warehouses created successfully!');
    } else {
      console.log('Warehouses already exist');
      
      // List all warehouses
      const warehouses = await WarehouseModel.find().select('name status phone pin');
      console.log('Existing warehouses:');
      warehouses.forEach(w => {
        console.log(`- ${w.name} (${w.status}) - ${w.phone} - ${w.pin}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndSeedWarehouses();
