import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * Delhivery Pickup Request Creation API
 * Creates pickup requests using Delhivery's API
 */

interface PickupCreateRequest {
  pickup_time: string;      // hh:mm:ss format
  pickup_date: string;      // YYYY-MM-DD format
  pickup_location: string;  // Registered warehouse name
  expected_package_count: number;
  waybillNumbers: string[];
  contactPerson: string;
  contactNumber: string;
}

// Pickup Request Schema
const PickupRequestSchema = new mongoose.Schema({
  pickupId: { type: String, required: true, unique: true },
  pickup_time: { type: String, required: true },
  pickup_date: { type: String, required: true },
  pickup_location: { type: String, required: true },
  expected_package_count: { type: Number, required: true },
  waybillNumbers: [{ type: String, required: true }],
  contactPerson: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { type: String, default: 'Scheduled' },
  delhiveryResponse: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const PickupRequest = mongoose.models.PickupRequest || mongoose.model('PickupRequest', PickupRequestSchema);

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    console.log('[Pickup Create API] Creating pickup request');

    const body: PickupCreateRequest = await request.json();
    const {
      pickup_time,
      pickup_date,
      pickup_location,
      expected_package_count,
      waybillNumbers,
      contactPerson,
      contactNumber
    } = body;

    // Validate required fields
    if (!pickup_time || !pickup_date || !pickup_location || !expected_package_count) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: pickup_time, pickup_date, pickup_location, expected_package_count'
      }, { status: 400 });
    }

    // Prepare Delhivery API request
    const delhiveryPayload = {
      pickup_time,
      pickup_date,
      pickup_location,
      expected_package_count
    };

    console.log('[Pickup Create API] Delhivery payload:', delhiveryPayload);

    // Call Delhivery API
    const delhiveryResponse = await fetch('https://track.delhivery.com/fm/request/new/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(delhiveryPayload)
    });

    const delhiveryResult = await delhiveryResponse.json();
    console.log('[Pickup Create API] Delhivery response:', delhiveryResult);

    if (!delhiveryResponse.ok) {
      throw new Error(`Delhivery API error: ${delhiveryResult.message || 'Unknown error'}`);
    }

    // Generate pickup ID
    const pickupId = delhiveryResult.pickup_id || `PU${Date.now()}`;

    // Save to MongoDB
    const pickupRecord = await PickupRequest.create({
      pickupId,
      pickup_time,
      pickup_date,
      pickup_location,
      expected_package_count,
      waybillNumbers: waybillNumbers || [],
      contactPerson,
      contactNumber,
      status: 'Scheduled',
      delhiveryResponse: delhiveryResult,
      isActive: true
    });

    console.log('[Pickup Create API] Pickup request created successfully');

    return NextResponse.json({
      success: true,
      message: 'Pickup request created successfully',
      data: {
        pickup_id: pickupId,
        _id: pickupRecord._id,
        pickup_time,
        pickup_date,
        pickup_location,
        expected_package_count,
        waybillNumbers,
        status: 'Scheduled',
        delhiveryResponse: delhiveryResult
      }
    });

  } catch (error: any) {
    console.error('[Pickup Create API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create pickup request'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const pickups = await PickupRequest.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: pickups.map(pickup => ({
        _id: pickup._id,
        pickupId: pickup.pickupId,
        pickup_time: pickup.pickup_time,
        pickup_date: pickup.pickup_date,
        pickup_location: pickup.pickup_location,
        expected_package_count: pickup.expected_package_count,
        waybillNumbers: pickup.waybillNumbers,
        contactPerson: pickup.contactPerson,
        contactNumber: pickup.contactNumber,
        status: pickup.status,
        scheduledDate: `${pickup.pickup_date} ${pickup.pickup_time}`,
        createdAt: pickup.createdAt,
        updatedAt: pickup.updatedAt
      }))
    });

  } catch (error: any) {
    console.error('[Pickup Create API] Error fetching pickups:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch pickup requests'
    }, { status: 500 });
  }
}
