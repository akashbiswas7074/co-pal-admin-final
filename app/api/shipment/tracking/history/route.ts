import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * Tracking History API
 * Fetch tracking records from MongoDB
 */

// Tracking History Schema
const TrackingHistorySchema = new mongoose.Schema({
  waybillNumber: { type: String, required: true, index: true },
  status: { type: String, required: true },
  currentLocation: { type: String, default: '' },
  estimatedDelivery: { type: String, default: '' },
  scans: [{
    date: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, required: true },
    description: { type: String, required: true }
  }],
  isAvailable: { type: Boolean, default: true },
  message: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, {
  timestamps: true
});

// Create or get the model
const TrackingHistory = mongoose.models.TrackingHistory || mongoose.model('TrackingHistory', TrackingHistorySchema);

// GET: Fetch tracking history
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const waybill = searchParams.get('waybill');

    let query = {};
    if (waybill) {
      query = { waybillNumber: { $regex: waybill, $options: 'i' } };
    }

    const trackingRecords = await TrackingHistory.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('shipmentId', 'primaryWaybill customerDetails status')
      .populate('orderId', '_id status totalAmount');

    console.log(`[Tracking History API] Found ${trackingRecords.length} tracking records`);

    return NextResponse.json({
      success: true,
      message: 'Tracking history fetched successfully',
      data: trackingRecords,
      count: trackingRecords.length
    });

  } catch (error) {
    console.error('[Tracking History API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST: Save tracking data to history
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { waybillNumber, status, currentLocation, estimatedDelivery, scans, shipmentId, orderId } = await request.json();

    if (!waybillNumber || !status) {
      return NextResponse.json({
        success: false,
        error: 'Waybill number and status are required'
      }, { status: 400 });
    }

    // Update or create tracking record
    const trackingRecord = await TrackingHistory.findOneAndUpdate(
      { waybillNumber },
      {
        waybillNumber,
        status,
        currentLocation: currentLocation || '',
        estimatedDelivery: estimatedDelivery || '',
        scans: scans || [],
        isAvailable: true,
        lastUpdated: new Date(),
        ...(shipmentId && { shipmentId }),
        ...(orderId && { orderId })
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    console.log('[Tracking History API] Tracking record saved:', trackingRecord._id);

    return NextResponse.json({
      success: true,
      message: 'Tracking record saved successfully',
      data: trackingRecord
    });

  } catch (error) {
    console.error('[Tracking History API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE: Remove tracking record
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const waybillNumber = searchParams.get('waybill');

    if (!waybillNumber) {
      return NextResponse.json({
        success: false,
        error: 'Waybill number is required'
      }, { status: 400 });
    }

    const deletedRecord = await TrackingHistory.findOneAndDelete({ waybillNumber });

    if (!deletedRecord) {
      return NextResponse.json({
        success: false,
        error: 'Tracking record not found'
      }, { status: 404 });
    }

    console.log('[Tracking History API] Tracking record deleted:', waybillNumber);

    return NextResponse.json({
      success: true,
      message: 'Tracking record deleted successfully',
      data: { waybillNumber }
    });

  } catch (error) {
    console.error('[Tracking History API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
