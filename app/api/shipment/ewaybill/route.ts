import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';

/**
 * E-waybill Management API
 * Full CRUD operations for e-waybill records
 */

interface EwaybillUpdateRequest {
  waybillNumber: string;
  ewaybillNumber: string;   // E-waybill number
  invoiceNumber: string;    // Invoice number
  invoiceValue: number;     // Invoice value
}

// E-waybill Schema
const EwaybillSchema = new mongoose.Schema({
  waybillNumber: { type: String, required: true, index: true },
  ewaybillNumber: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceValue: { type: Number, required: true },
  status: { type: String, default: 'Active' },
  validUntil: { type: Date },
  delhiveryResponse: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create or get the model
const EwaybillRecord = mongoose.models.EwaybillRecord || mongoose.model('EwaybillRecord', EwaybillSchema);

// POST: Create/Update E-waybill
export async function POST(request: NextRequest) {
  try {
    const body: EwaybillUpdateRequest = await request.json();
    const { waybillNumber, ewaybillNumber, invoiceNumber, invoiceValue } = body;

    console.log('[E-waybill API] Update request:', { waybillNumber, ewaybillNumber, invoiceNumber, invoiceValue });

    // Validate required fields
    if (!waybillNumber || !ewaybillNumber || !invoiceNumber || !invoiceValue) {
      return NextResponse.json({
        success: false,
        error: 'Waybill number, e-waybill number, invoice number, and invoice value are required'
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

    // Update E-waybill via Delhivery API
    const delhiveryResult = await delhiveryAPI.updateEwaybill(waybillNumber, { 
      dcn: invoiceNumber, 
      ewbn: ewaybillNumber 
    });

    // Calculate validity (typically 3 months from creation)
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 3);

    // Save to MongoDB
    const ewaybillRecord = await EwaybillRecord.findOneAndUpdate(
      { waybillNumber },
      {
        waybillNumber,
        ewaybillNumber,
        invoiceNumber,
        invoiceValue,
        status: 'Active',
        validUntil,
        delhiveryResponse: delhiveryResult,
        isActive: true
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    console.log('[E-waybill API] Update successful');

    return NextResponse.json({
      success: true,
      message: 'E-waybill updated successfully',
      data: {
        _id: ewaybillRecord._id,
        waybillNumber,
        ewaybillNumber,
        invoiceNumber,
        invoiceValue,
        status: ewaybillRecord.status,
        validUntil: ewaybillRecord.validUntil,
        updatedAt: ewaybillRecord.updatedAt
      }
    });

  } catch (error) {
    console.error('[E-waybill API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET: Get E-waybill records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    await connectToDatabase();

    if (waybill) {
      // Get specific waybill record
      const record = await EwaybillRecord.findOne({ waybillNumber: waybill, isActive: true });
      
      if (!record) {
        return NextResponse.json({
          success: false,
          error: 'E-waybill record not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: record
      });
    } else {
      // Get all e-waybill records with pagination
      const records = await EwaybillRecord.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await EwaybillRecord.countDocuments({ isActive: true });

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
    console.error('[E-waybill API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Delete E-waybill record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const waybill = searchParams.get('waybill');

    if (!id && !waybill) {
      return NextResponse.json({
        success: false,
        error: 'Either ID or waybill number is required'
      }, { status: 400 });
    }

    await connectToDatabase();

    let query: any = { isActive: true };
    if (id) {
      query._id = id;
    } else if (waybill) {
      query.waybillNumber = waybill;
    }

    const record = await EwaybillRecord.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({
        success: false,
        error: 'E-waybill record not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'E-waybill record deleted successfully',
      data: { id: record._id }
    });

  } catch (error) {
    console.error('[E-waybill API] Delete error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
