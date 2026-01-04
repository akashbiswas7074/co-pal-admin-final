import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

/**
 * Pincode Serviceability API
 * Check if pincodes are serviceable for shipping
 */

// GET: Check pincode serviceability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const productType = searchParams.get('productType') || 'standard';

    if (!pincode) {
      return NextResponse.json({
        success: false,
        error: 'pincode parameter is required'
      }, { status: 400 });
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pincode format. Must be 6 digits.'
      }, { status: 400 });
    }

    console.log('[Serviceability API] Checking pincode:', { pincode, productType });

    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured'
      }, { status: 500 });
    }

    let result;

    if (productType === 'heavy') {
      result = await delhiveryAPI.checkHeavyPincodeServiceability(pincode);
      
      return NextResponse.json({
        success: true,
        data: {
          pincode,
          productType: 'heavy',
          serviceable: result.serviceable,
          paymentTypes: result.paymentTypes,
          details: result.details
        }
      });
    } else {
      result = await delhiveryAPI.checkPincodeServiceability(pincode);
      
      return NextResponse.json({
        success: true,
        data: {
          pincode,
          productType: 'standard',
          serviceable: result.serviceable,
          embargo: result.embargo,
          remark: result.remark,
          details: result.details
        }
      });
    }

  } catch (error: any) {
    console.error('[Serviceability API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check pincode serviceability'
    }, { status: 500 });
  }
}

// POST: Check pincode serviceability (batch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincode, pincodes, productType = 'standard' } = body;

    // Support both single pincode and array of pincodes
    const pincodeList = pincode ? [pincode] : pincodes;

    if (!pincodeList || pincodeList.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'pincode or pincodes array is required'
      }, { status: 400 });
    }

    console.log('[Serviceability API] Checking pincodes:', { pincodeList, productType });

    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured'
      }, { status: 500 });
    }

    // Check first pincode for single requests
    const firstPincode = pincodeList[0];
    
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(firstPincode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pincode format. Must be 6 digits.'
      }, { status: 400 });
    }

    let result;

    if (productType === 'heavy') {
      result = await delhiveryAPI.checkHeavyPincodeServiceability(firstPincode);
      
      return NextResponse.json({
        success: true,
        data: {
          pincode: firstPincode,
          productType: 'heavy',
          serviceable: result.serviceable,
          city: result.details?.city || 'Unknown',
          state: result.details?.state || 'Unknown',
          estimatedDays: result.details?.estimatedDays || 'N/A',
          environment: 'PRODUCTION'
        }
      });
    } else {
      result = await delhiveryAPI.checkPincodeServiceability(firstPincode);
      
      return NextResponse.json({
        success: true,
        data: {
          pincode: firstPincode,
          productType: 'standard',
          serviceable: result.serviceable,
          city: result.details?.city || 'Unknown',
          state: result.details?.state || 'Unknown',
          estimatedDays: result.details?.estimatedDays || 'N/A',
          environment: 'PRODUCTION'
        }
      });
    }

  } catch (error) {
    console.error('[Serviceability API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check pincode serviceability'
    }, { status: 500 });
  }
}
