import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * Serviceability Cache API
 * Cache serviceability results from Delhivery API
 */

// Serviceability Cache Schema
const ServiceabilityCacheSchema = new mongoose.Schema({
  pincode: { type: String, required: true, index: true, unique: true },
  serviceable: { type: Boolean, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  estimatedDays: { type: Number },
  deliveryType: { type: String, default: 'Standard' },
  cashOnDelivery: { type: Boolean, default: false },
  prepaid: { type: Boolean, default: true },
  pickupAvailable: { type: Boolean, default: true },
  returnPickupAvailable: { type: Boolean, default: true },
  lastChecked: { type: Date, default: Date.now },
  isValid: { type: Boolean, default: true },
  source: { type: String, default: 'Delhivery' }
}, {
  timestamps: true
});

// Create or get the model
const ServiceabilityCache = mongoose.models.ServiceabilityCache || mongoose.model('ServiceabilityCache', ServiceabilityCacheSchema);

// GET: Fetch serviceability cache
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query: any = { isValid: true };
    if (pincode) {
      query.pincode = { $regex: pincode, $options: 'i' };
    }

    const cacheRecords = await ServiceabilityCache.find(query)
      .sort({ lastChecked: -1 })
      .limit(limit);

    console.log(`[Serviceability Cache API] Found ${cacheRecords.length} cache records`);

    return NextResponse.json({
      success: true,
      message: 'Serviceability cache fetched successfully',
      data: cacheRecords,
      count: cacheRecords.length
    });

  } catch (error) {
    console.error('[Serviceability Cache API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST: Save serviceability result to cache
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { 
      pincode, 
      serviceable, 
      city, 
      state, 
      estimatedDays,
      deliveryType,
      cashOnDelivery,
      prepaid,
      pickupAvailable,
      returnPickupAvailable 
    } = await request.json();

    if (!pincode || serviceable === undefined || !city || !state) {
      return NextResponse.json({
        success: false,
        error: 'Pincode, serviceable status, city, and state are required'
      }, { status: 400 });
    }

    // Update or create cache record
    const cacheRecord = await ServiceabilityCache.findOneAndUpdate(
      { pincode },
      {
        pincode,
        serviceable,
        city,
        state,
        estimatedDays: estimatedDays || null,
        deliveryType: deliveryType || 'Standard',
        cashOnDelivery: cashOnDelivery || false,
        prepaid: prepaid !== undefined ? prepaid : true,
        pickupAvailable: pickupAvailable !== undefined ? pickupAvailable : true,
        returnPickupAvailable: returnPickupAvailable !== undefined ? returnPickupAvailable : true,
        lastChecked: new Date(),
        isValid: true
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    console.log('[Serviceability Cache API] Cache record saved:', cacheRecord._id);

    return NextResponse.json({
      success: true,
      message: 'Serviceability result cached successfully',
      data: cacheRecord
    });

  } catch (error) {
    console.error('[Serviceability Cache API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE: Remove cache record
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    if (!pincode) {
      return NextResponse.json({
        success: false,
        error: 'Pincode is required'
      }, { status: 400 });
    }

    const deletedRecord = await ServiceabilityCache.findOneAndDelete({ pincode });

    if (!deletedRecord) {
      return NextResponse.json({
        success: false,
        error: 'Cache record not found'
      }, { status: 404 });
    }

    console.log('[Serviceability Cache API] Cache record deleted:', pincode);

    return NextResponse.json({
      success: true,
      message: 'Cache record deleted successfully',
      data: { pincode }
    });

  } catch (error) {
    console.error('[Serviceability Cache API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
