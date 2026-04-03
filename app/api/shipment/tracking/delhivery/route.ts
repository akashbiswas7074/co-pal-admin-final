import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * Delhivery Shipment Tracking API
 * Fetches tracking information from Delhivery API
 */

// Tracking Schema for storing tracking history
const TrackingHistorySchema = new mongoose.Schema({
  waybillNumber: { type: String, required: true, index: true },
  status: { type: String, required: true },
  currentLocation: { type: String },
  estimatedDelivery: { type: String },
  scans: [{
    date: String,
    location: String,
    status: String,
    description: String
  }],
  delhiveryResponse: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const TrackingHistory = mongoose.models.TrackingHistory || mongoose.model('TrackingHistory', TrackingHistorySchema);

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const ref_ids = searchParams.get('ref_ids') || '';

    if (!waybill) {
      return NextResponse.json({
        success: false,
        error: 'Waybill number is required'
      }, { status: 400 });
    }

    console.log('[Delhivery Tracking API] Tracking waybill:', waybill);

    // Call Delhivery Tracking API
    const delhiveryUrl = `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}&ref_ids=${ref_ids}`;
    
    const delhiveryResponse = await fetch(delhiveryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const delhiveryResult = await delhiveryResponse.json();
    console.log('[Delhivery Tracking API] Response:', delhiveryResult);

    if (!delhiveryResponse.ok) {
      throw new Error(`Delhivery API error: ${delhiveryResult.message || 'Tracking not available'}`);
    }

    // Parse Delhivery response
    const shipmentData = delhiveryResult.ShipmentData?.[0];
    
    if (!shipmentData) {
      return NextResponse.json({
        success: false,
        error: 'No tracking data found for this waybill'
      }, { status: 404 });
    }

    // Extract tracking information
    const trackingInfo = {
      status: shipmentData.Shipment?.Status?.Status || 'Unknown',
      current_location: shipmentData.Shipment?.Origin || shipmentData.Shipment?.Destination || 'Unknown',
      estimated_delivery: shipmentData.Shipment?.ExpectedDeliveryDate || 'TBD',
      scans: shipmentData.Shipment?.Scans?.map((scan: any) => ({
        date: scan.ScanDateTime,
        location: scan.ScannedLocation,
        status: scan.Scan,
        description: scan.Instructions || scan.Scan
      })) || []
    };

    // Save to MongoDB for history
    await TrackingHistory.findOneAndUpdate(
      { waybillNumber: waybill },
      {
        waybillNumber: waybill,
        status: trackingInfo.status,
        currentLocation: trackingInfo.current_location,
        estimatedDelivery: trackingInfo.estimated_delivery,
        scans: trackingInfo.scans,
        delhiveryResponse: delhiveryResult,
        isActive: true
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    return NextResponse.json({
      success: true,
      data: trackingInfo
    });

  } catch (error: any) {
    console.error('[Delhivery Tracking API] Error:', error);
    
    // Return structured error response
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch tracking information',
      data: {
        status: 'Error',
        current_location: 'N/A',
        estimated_delivery: 'N/A',
        scans: []
      }
    }, { status: 500 });
  }
}
