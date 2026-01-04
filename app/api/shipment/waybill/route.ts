import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';
import { waybillService } from '@/lib/shipment/waybill-service';

/**
 * Enhanced Waybill Management API
 * Handle bulk and single waybill generation with direct Delhivery API access
 * 
 * Rate Limits (from Delhivery API documentation):
 * - Bulk Waybill: Up to 10,000 waybills per request, max 50,000 per 5 minutes
 * - Single Waybill: Up to 750 requests per 5 minutes
 * - Waybills are generated in batches of 25 at backend
 */

// GET: Fetch waybills (bulk or single) or check waybill status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = searchParams.get('count');
    const type = searchParams.get('type') || 'single';
    const waybill = searchParams.get('waybill');
    const action = searchParams.get('action') || 'generate';
    const useStored = searchParams.get('useStored') === 'true';

    console.log('[Waybill API] GET request:', { count, type, waybill, action, useStored });

    // Check waybill status
    if (action === 'check' && waybill) {
      const isValid = waybill.length >= 10 && /^[A-Z0-9_]+$/.test(waybill);
      
      return NextResponse.json({
        success: true,
        data: {
          waybill,
          isValid,
          status: isValid ? 'Valid' : 'Invalid'
        }
      });
    }

    // Generate waybills
    if (!delhiveryAPI.isConfigured()) {
      console.log('[Waybill API] Delhivery not configured, using service layer');
      
      // Fallback to service layer
      if (type === 'bulk' && count) {
        const waybillCount = parseInt(count);
        if (isNaN(waybillCount) || waybillCount < 1 || waybillCount > 100) {
          return NextResponse.json({
            success: false,
            error: 'Count must be between 1 and 100 for service layer'
          }, { status: 400 });
        }

        const waybills = await shipmentService.generateWaybills(waybillCount);
        return NextResponse.json({
          success: true,
          data: {
            waybills,
            count: waybills.length,
            type: 'bulk',
            source: 'service'
          }
        });
      } else {
        const waybills = await shipmentService.generateWaybills(1);
        return NextResponse.json({
          success: true,
          data: {
            waybill: waybills[0],
            type: 'single',
            source: 'service'
          }
        });
      }
    }

    if (type === 'bulk') {
      if (!count) {
        return NextResponse.json({
          success: false,
          error: 'Count parameter is required for bulk waybill generation'
        }, { status: 400 });
      }

      const waybillCount = parseInt(count);
      if (isNaN(waybillCount) || waybillCount < 1 || waybillCount > 10000) {
        return NextResponse.json({
          success: false,
          error: 'Count must be between 1 and 10,000'
        }, { status: 400 });
      }

      // Use stored waybills if requested and available
      if (useStored) {
        try {
          const storedWaybills = await waybillService.getAvailableWaybills(waybillCount);
          if (storedWaybills.length >= waybillCount) {
            return NextResponse.json({
              success: true,
              data: {
                waybills: storedWaybills,
                count: storedWaybills.length,
                type: 'bulk',
                source: 'stored',
                rateLimits: delhiveryAPI.getWaybillRateLimits(),
                note: 'Using stored waybills for instant availability'
              }
            });
          }
        } catch (error) {
          console.warn('[Waybill API] Error getting stored waybills:', error);
        }
      }

      const waybills = await delhiveryAPI.generateWaybillsWithFallback(waybillCount);
      
      return NextResponse.json({
        success: true,
        data: {
          waybills,
          count: waybills.length,
          type: 'bulk',
          source: 'delhivery',
          rateLimits: delhiveryAPI.getWaybillRateLimits(),
          note: 'Waybills are generated in batches of 25 at backend. Store them for later use in manifest creation.'
        }
      });
    } else {
      // Single waybill - check stored waybills first if requested
      if (useStored) {
        try {
          const storedWaybills = await waybillService.getAvailableWaybills(1);
          if (storedWaybills.length > 0) {
            return NextResponse.json({
              success: true,
              data: {
                waybill: storedWaybills[0],
                type: 'single',
                source: 'stored',
                rateLimits: delhiveryAPI.getWaybillRateLimits()
              }
            });
          }
        } catch (error) {
          console.warn('[Waybill API] Error getting stored waybill:', error);
        }
      }

      // Single waybill - use the optimized single waybill API
      const waybill = await delhiveryAPI.fetchSingleWaybill();
      
      return NextResponse.json({
        success: true,
        data: {
          waybill,
          type: 'single',
          source: 'delhivery',
          rateLimits: delhiveryAPI.getWaybillRateLimits()
        }
      });
    }

  } catch (error: any) {
    console.error('[Waybill API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process waybill request'
    }, { status: 500 });
  }
}

// POST: Generate and store waybills
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 1, storeInDB = false, useStored = false } = body;

    console.log('[Waybill API] POST request:', { count, storeInDB, useStored });

    if (count < 1 || count > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Count must be between 1 and 10,000'
      }, { status: 400 });
    }

    let waybills: string[];
    let source: string;

    // Check if we should use stored waybills first
    if (useStored) {
      try {
        const storedWaybills = await waybillService.getAvailableWaybills(count);
        if (storedWaybills.length >= count) {
          return NextResponse.json({
            success: true,
            data: {
              waybills: storedWaybills,
              count: storedWaybills.length,
              stored: true,
              source: 'stored',
              rateLimits: delhiveryAPI.isConfigured() ? delhiveryAPI.getWaybillRateLimits() : null,
              message: `Successfully retrieved ${storedWaybills.length} stored waybills`,
              note: 'Using stored waybills for instant availability'
            }
          });
        } else {
          console.log(`[Waybill API] Only ${storedWaybills.length} stored waybills available, generating ${count - storedWaybills.length} more`);
        }
      } catch (error) {
        console.warn('[Waybill API] Error getting stored waybills:', error);
      }
    }

    // Generate new waybills
    if (delhiveryAPI.isConfigured()) {
      // Use the enhanced waybill generation method
      waybills = await delhiveryAPI.generateWaybillsWithFallback(count);
      source = 'delhivery';
    } else {
      // Fallback to service layer
      waybills = await shipmentService.generateWaybills(count);
      source = 'service';
    }

    if (!waybills || waybills.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No waybills generated'
      }, { status: 500 });
    }

    // Store waybills in database if requested
    if (storeInDB) {
      try {
        await waybillService.generateAndStoreWaybills(0, 'DEMO'); // This will store the generated waybills
        console.log('[Waybill API] Waybills stored in database');
      } catch (error) {
        console.warn('[Waybill API] Error storing waybills in database:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        waybills,
        count: waybills.length,
        stored: storeInDB,
        source,
        rateLimits: delhiveryAPI.isConfigured() ? delhiveryAPI.getWaybillRateLimits() : null,
        message: `Successfully generated ${waybills.length} waybills`,
        note: 'Store waybills for later use in manifest creation as recommended by Delhivery'
      }
    });

  } catch (error: any) {
    console.error('[Waybill API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate waybills'
    }, { status: 500 });
  }
}