import { NextRequest, NextResponse } from 'next/server';
import { waybillService } from '@/lib/shipment/waybill-service';

/**
 * Waybill Management API
 * Handles waybill statistics, stock management, and administrative operations
 */

// GET: Get waybill statistics and stock information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const count = searchParams.get('count');
    const source = searchParams.get('source');

    console.log('[Waybill Management API] GET request:', { action, count, source });

    switch (action) {
      case 'stats':
        // Get waybill statistics
        const stats = await waybillService.getWaybillStats();
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            timestamp: new Date().toISOString()
          }
        });

      case 'available':
        // Get available waybills
        const availableCount = count ? parseInt(count) : 10;
        const availableWaybills = await waybillService.getAvailableWaybills(availableCount, source || undefined);
        
        return NextResponse.json({
          success: true,
          data: {
            waybills: availableWaybills,
            count: availableWaybills.length,
            requested: availableCount,
            source: source || 'all'
          }
        });

      case 'stock':
        // Check stock levels
        const stockStats = await waybillService.getWaybillStats();
        
        return NextResponse.json({
          success: true,
          data: {
            available: stockStats.generated,
            reserved: stockStats.reserved,
            used: stockStats.used,
            total: stockStats.total,
            recommendation: stockStats.generated < 100 ? 'LOW_STOCK' : 'ADEQUATE',
            bySource: stockStats.bySource
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: stats, available, stock'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Waybill Management API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process waybill management request'
    }, { status: 500 });
  }
}

// POST: Generate and store waybills, ensure stock, reserve waybills
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'generate',
      count = 100,
      source = 'DELHIVERY_BULK',
      minStock = 100,
      waybills = [],
      reservedBy = 'system'
    } = body;

    console.log('[Waybill Management API] POST request:', { action, count, source, minStock });

    switch (action) {
      case 'generate':
        // Generate and store waybills
        const generatedWaybills = await waybillService.generateAndStoreWaybills(
          count, 
          source as 'DELHIVERY_BULK' | 'DELHIVERY_SINGLE' | 'DEMO'
        );
        
        return NextResponse.json({
          success: true,
          data: {
            waybills: generatedWaybills,
            count: generatedWaybills.length,
            source,
            message: `Successfully generated and stored ${generatedWaybills.length} waybills`
          }
        });

      case 'ensure_stock':
        // Ensure minimum stock
        await waybillService.ensureMinimumStock(minStock);
        const stockStats = await waybillService.getWaybillStats();
        
        return NextResponse.json({
          success: true,
          data: {
            minStock,
            currentStock: stockStats.generated,
            ensured: true,
            message: `Stock ensured. ${stockStats.generated} waybills available`
          }
        });

      case 'reserve':
        // Reserve waybills
        if (!waybills || waybills.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Waybills array is required for reservation'
          }, { status: 400 });
        }

        const reserved = await waybillService.reserveWaybills(waybills, reservedBy);
        
        return NextResponse.json({
          success: true,
          data: {
            waybills,
            reserved,
            reservedBy,
            message: `${reserved ? 'Successfully' : 'Failed to'} reserve ${waybills.length} waybills`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: generate, ensure_stock, reserve'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Waybill Management API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process waybill management request'
    }, { status: 500 });
  }
}

// PUT: Update waybill status (use, cancel)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'use',
      waybill,
      orderId,
      shipmentId
    } = body;

    console.log('[Waybill Management API] PUT request:', { action, waybill, orderId, shipmentId });

    if (!waybill) {
      return NextResponse.json({
        success: false,
        error: 'Waybill is required'
      }, { status: 400 });
    }

    switch (action) {
      case 'use':
        // Use waybill for order/shipment
        if (!orderId || !shipmentId) {
          return NextResponse.json({
            success: false,
            error: 'orderId and shipmentId are required for using waybill'
          }, { status: 400 });
        }

        const used = await waybillService.useWaybill(waybill, orderId, shipmentId);
        
        return NextResponse.json({
          success: true,
          data: {
            waybill,
            used,
            orderId,
            shipmentId,
            message: `${used ? 'Successfully' : 'Failed to'} use waybill ${waybill}`
          }
        });

      case 'cancel':
        // Cancel waybill
        const cancelled = await waybillService.cancelWaybill(waybill);
        
        return NextResponse.json({
          success: true,
          data: {
            waybill,
            cancelled,
            message: `${cancelled ? 'Successfully' : 'Failed to'} cancel waybill ${waybill}`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: use, cancel'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Waybill Management API] PUT Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process waybill management request'
    }, { status: 500 });
  }
}
