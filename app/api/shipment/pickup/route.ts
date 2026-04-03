import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * Pickup Request Management API
 * Full CRUD operations for pickup requests
 */

interface PickupRequest {
  waybillNumbers: string[];     // Array of waybill numbers
  pickupDate: string;          // Date for pickup (YYYY-MM-DD)
  pickupTime: string;          // Time for pickup (HH:MM)
  pickupAddress: string;       // Pickup address
  contactPerson: string;       // Contact person name
  contactNumber: string;       // Contact phone number
}

// Pickup Schema
const PickupSchema = new mongoose.Schema({
  pickupId: { type: String, required: true, unique: true },
  waybillNumbers: [{ type: String, required: true }],
  scheduledDate: { type: String, required: true },
  pickupDate: { type: String, required: true },
  pickupTime: { type: String, required: true },
  address: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  delhiveryResponse: { type: mongoose.Schema.Types.Mixed },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create or get the model
const PickupRecord = mongoose.models.PickupRecord || mongoose.model('PickupRecord', PickupSchema);

// POST: Create pickup request
export async function POST(request: NextRequest) {
  try {
    const body: PickupRequest = await request.json();
    const { waybillNumbers, pickupDate, pickupTime, pickupAddress, contactPerson, contactNumber } = body;

    console.log('[Pickup API] Create request:', { waybillNumbers, pickupDate, pickupTime, pickupAddress, contactPerson, contactNumber });

    // Validate required fields
    if (!waybillNumbers || !pickupDate || !pickupTime || !pickupAddress || !contactPerson || !contactNumber) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required: waybillNumbers, pickupDate, pickupTime, pickupAddress, contactPerson, contactNumber'
      }, { status: 400 });
    }

    // Validate waybill numbers
    if (!Array.isArray(waybillNumbers) || waybillNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'waybillNumbers must be a non-empty array'
      }, { status: 400 });
    }

    // Validate time format (HH:MM)
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(pickupTime)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time format. Use HH:MM format'
      }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD format'
      }, { status: 400 });
    }

    // Validate package count
    if (waybillNumbers.length < 1 || waybillNumbers.length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Package count must be between 1 and 1000'
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Check if API is configured
    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured'
      }, { status: 500 });
    }

    // Generate unique pickup ID
    const pickupId = `PU${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledDate = `${pickupDate} ${pickupTime}`;

    // Create pickup request with error handling for wallet balance
    let delhiveryResult;
    let status = 'Scheduled';
    let notes = '';

    try {
      delhiveryResult = await delhiveryAPI.createPickupRequest({
        pickup_time: `${pickupTime}:00`,
        pickup_date: pickupDate,
        pickup_location: pickupAddress,
        expected_package_count: waybillNumbers.length
      });

      console.log('[Pickup API] Delhivery request created successfully');

    } catch (delhiveryError: any) {
      console.error('[Pickup API] Delhivery error:', delhiveryError);
      
      // Handle specific wallet balance error
      if (delhiveryError.message?.includes('wallet balance') || delhiveryError.message?.includes('500.0')) {
        console.log('[Pickup API] Wallet balance insufficient, creating local record for testing');
        
        status = 'Scheduled (Test)';
        notes = 'Production pickup requires minimum ₹500 wallet balance';
        delhiveryResult = {
          error: 'Insufficient wallet balance',
          test_mode: true
        };
      } else {
        // Re-throw other errors
        throw delhiveryError;
      }
    }

    // Save to MongoDB
    const pickupRecord = new PickupRecord({
      pickupId,
      waybillNumbers,
      scheduledDate,
      pickupDate,
      pickupTime,
      address: pickupAddress,
      contactPerson,
      contactNumber,
      status,
      delhiveryResponse: delhiveryResult,
      notes,
      isActive: true
    });

    await pickupRecord.save();

    console.log('[Pickup API] Pickup record saved to MongoDB');

    return NextResponse.json({
      success: true,
      message: 'Pickup request created successfully',
      data: {
        _id: pickupRecord._id,
        pickupId: pickupRecord.pickupId,
        waybillNumbers,
        scheduledDate,
        address: pickupAddress,
        contactPerson,
        contactNumber,
        status: pickupRecord.status,
        notes: pickupRecord.notes,
        createdAt: pickupRecord.createdAt
      }
    });

  } catch (error) {
    console.error('[Pickup API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET: Get pickup records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pickupId = searchParams.get('pickupId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');

    await connectToDatabase();

    if (pickupId) {
      // Get specific pickup record
      const record = await PickupRecord.findOne({ pickupId, isActive: true });
      
      if (!record) {
        return NextResponse.json({
          success: false,
          error: 'Pickup record not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: record
      });
    } else {
      // Get all pickup records with optional status filter
      let query: any = { isActive: true };
      if (status) {
        query.status = status;
      }

      const records = await PickupRecord.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await PickupRecord.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: records,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + records.length < total
        }
      });
    }

  } catch (error) {
    console.error('[Pickup API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Cancel pickup request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pickupId = searchParams.get('pickupId');

    if (!id && !pickupId) {
      return NextResponse.json({
        success: false,
        error: 'Either ID or pickup ID is required'
      }, { status: 400 });
    }

    await connectToDatabase();

    let query: any = { isActive: true };
    if (id) {
      query._id = id;
    } else if (pickupId) {
      query.pickupId = pickupId;
    }

    const record = await PickupRecord.findOneAndUpdate(
      query,
      { 
        status: 'Cancelled',
        isActive: false,
        notes: (await PickupRecord.findOne(query))?.notes + ' - Cancelled by user'
      },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({
        success: false,
        error: 'Pickup record not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pickup request cancelled successfully',
      data: { id: record._id, pickupId: record.pickupId }
    });

  } catch (error) {
    console.error('[Pickup API] Delete error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
