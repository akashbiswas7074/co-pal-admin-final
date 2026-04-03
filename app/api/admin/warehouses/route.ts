import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Warehouse from '@/lib/database/models/warehouse.model';

export async function GET() {
  try {
    await connectToDatabase();
    
    const warehouses = await Warehouse.find({}).lean();
    
    return NextResponse.json({
      success: true,
      data: {
        count: warehouses.length,
        warehouses: warehouses.map(w => ({
          name: w.name,
          city: w.city,
          state: w.state,
          status: w.status
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    
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
      }
    ];

    // Clear existing warehouses and create new ones
    await Warehouse.deleteMany({});
    const createdWarehouses = await Warehouse.insertMany(sampleWarehouses);
    
    return NextResponse.json({
      success: true,
      message: 'Warehouses created successfully',
      data: {
        count: createdWarehouses.length,
        warehouses: createdWarehouses.map(w => ({
          name: w.name,
          city: w.city,
          state: w.state,
          status: w.status
        }))
      }
    });
  } catch (error: any) {
    console.error('Error creating warehouses:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
