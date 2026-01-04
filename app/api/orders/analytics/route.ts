import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | 'state' | 'city' | 'status' || 'day';

    console.log('[Orders Analytics API] Fetching analytics:', {
      fromDate,
      toDate,
      groupBy
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

    // Fetch analytics from Delhivery API
    const analytics = await delhiveryAPI.getOrderAnalytics({
      fromDate,
      toDate,
      groupBy
    });

    console.log('[Orders Analytics API] Analytics fetched successfully:', {
      totalOrders: analytics.totalOrders,
      totalAmount: analytics.totalAmount,
      deliveryRate: analytics.deliveryRate
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Orders Analytics API] Error fetching analytics:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch analytics: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromDate, toDate, groupBy, customFilters } = body;

    console.log('[Orders Analytics API] Custom analytics request:', {
      fromDate,
      toDate,
      groupBy,
      customFilters
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

    // Fetch analytics with custom filters
    const analytics = await delhiveryAPI.getOrderAnalytics({
      fromDate,
      toDate,
      groupBy,
      ...customFilters
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Orders Analytics API] Error in POST request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to process analytics request: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}
