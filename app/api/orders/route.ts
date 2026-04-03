import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const waybill = searchParams.get('waybill') || undefined;
    const referenceNumber = searchParams.get('referenceNumber') || undefined;
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const destination = searchParams.get('destination') || undefined;
    const origin = searchParams.get('origin') || undefined;
    const orderType = searchParams.get('orderType') || undefined;
    const paymentMode = searchParams.get('paymentMode') || undefined;
    const sortBy = searchParams.get('sortBy') as 'date' | 'status' | 'amount' | 'waybill' || 'date';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    console.log('[Orders API] Fetching orders with filters:', {
      page,
      limit,
      fromDate,
      toDate,
      status,
      waybill,
      referenceNumber,
      state,
      city,
      destination,
      origin,
      orderType,
      paymentMode,
      sortBy,
      sortOrder
    });

    // Check if API is configured
    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Delhivery API is not configured. Please check your environment variables.' 
        },
        { status: 500 }
      );
    }

    // Fetch orders from Delhivery API
    const result = await delhiveryAPI.fetchOrders({
      page,
      limit,
      fromDate,
      toDate,
      status,
      waybill,
      referenceNumber,
      state,
      city,
      destination,
      origin,
      orderType,
      paymentMode,
      sortBy,
      sortOrder
    });

    console.log('[Orders API] Orders fetched successfully:', {
      totalOrders: result.orders.length,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.page
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch orders: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('[Orders API] POST request:', { action, data });

    // Check if API is configured
    if (!delhiveryAPI.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Delhivery API is not configured. Please check your environment variables.' 
        },
        { status: 500 }
      );
    }

    switch (action) {
      case 'fetchByWaybills':
        {
          const { waybills } = data;
          if (!waybills || !Array.isArray(waybills)) {
            return NextResponse.json(
              { success: false, error: 'Waybills array is required' },
              { status: 400 }
            );
          }

          const orders = await delhiveryAPI.fetchOrdersByWaybills(waybills);
          
          return NextResponse.json({
            success: true,
            data: {
              orders,
              count: orders.length
            }
          });
        }

      case 'fetchByReference':
        {
          const { referenceNumber } = data;
          if (!referenceNumber) {
            return NextResponse.json(
              { success: false, error: 'Reference number is required' },
              { status: 400 }
            );
          }

          const order = await delhiveryAPI.fetchOrderByReference(referenceNumber);
          
          return NextResponse.json({
            success: true,
            data: order
          });
        }

      case 'search':
        {
          const searchQuery = data.searchQuery || {};
          const results = await delhiveryAPI.searchOrders(searchQuery);
          
          return NextResponse.json({
            success: true,
            data: results
          });
        }

      case 'analytics':
        {
          const options = data.options || {};
          const analytics = await delhiveryAPI.getOrderAnalytics(options);
          
          return NextResponse.json({
            success: true,
            data: analytics
          });
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Orders API] Error in POST request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to process request: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}
