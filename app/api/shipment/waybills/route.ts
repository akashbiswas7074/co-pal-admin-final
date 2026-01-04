import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

/**
 * Delhivery Waybill Generation API
 * Uses production-only endpoints with enhanced features
 */

interface WaybillRequest {
  count: number;
  mode?: 'single' | 'bulk';
  store?: boolean;
}

// POST: Generate waybills
export async function POST(request: NextRequest) {
  try {
    const body: WaybillRequest = await request.json();
    const { count, mode = 'single', store = false } = body;

    console.log('[Waybill API] POST request:', { count, mode, store });

    // Validate count
    if (!count || count < 1 || count > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Count must be between 1 and 10000'
      }, { status: 400 });
    }

    // Check if API is configured
    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured. Please check your environment variables.'
      }, { status: 500 });
    }

    let waybills: string[] = [];

    if (mode === 'single' && count === 1) {
      // Use single waybill API for single waybill requests
      const waybill = await delhiveryAPI.fetchSingleWaybill();
      waybills = [waybill];
    } else {
      // Use bulk waybill API with automatic fallback
      waybills = await delhiveryAPI.generateWaybillsWithFallback(count);
    }

    console.log('[Waybill API] Generated waybills:', waybills.length);

    // Optional: Store waybills if requested
    if (store) {
      console.log('[Waybill API] Waybills flagged for storage');
    }

    return NextResponse.json({
      success: true,
      message: `${waybills.length} waybill(s) generated successfully`,
      data: {
        waybills,
        count: waybills.length,
        mode,
        environment: 'PRODUCTION',
        generated_at: new Date().toISOString(),
        rate_limits: delhiveryAPI.getWaybillRateLimits()
      }
    });

  } catch (error) {
    console.error('[Waybill API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET: Get waybills or validate existing waybill
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const count = parseInt(searchParams.get('count') || '1');
    const mode = searchParams.get('mode') as 'single' | 'bulk' || 'single';

    // If waybill is provided, validate it
    if (waybill) {
      const isValid = /^[A-Z0-9]{10,15}$/.test(waybill);
      
      return NextResponse.json({
        success: true,
        data: {
          waybill,
          valid: isValid,
          trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
          environment: 'PRODUCTION'
        }
      });
    }

    // Otherwise, generate waybills
    console.log('[Waybill API] GET request:', { count, mode });

    // Validate count
    if (count < 1 || count > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Count must be between 1 and 10000'
      }, { status: 400 });
    }

    // Check if API is configured
    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Delhivery API not configured'
      }, { status: 500 });
    }

    let waybills: string[] = [];

    if (mode === 'single' && count === 1) {
      // Use single waybill API for single waybill requests
      const waybill = await delhiveryAPI.fetchSingleWaybill();
      waybills = [waybill];
    } else {
      // Use bulk waybill API with automatic fallback
      waybills = await delhiveryAPI.generateWaybillsWithFallback(count);
    }

    console.log('[Waybill API] Generated waybills:', waybills.length);

    return NextResponse.json({
      success: true,
      data: {
        waybills,
        count: waybills.length,
        mode,
        environment: 'PRODUCTION',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Waybill API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
