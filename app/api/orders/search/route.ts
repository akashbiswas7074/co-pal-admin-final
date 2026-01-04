import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchQuery = body.searchQuery || {};

    console.log('[Orders Search API] Search request:', { searchQuery });

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

    // Perform search
    const searchResults = await delhiveryAPI.searchOrders(searchQuery);

    console.log('[Orders Search API] Search completed:', {
      totalResults: searchResults.totalResults,
      searchTime: searchResults.searchTime,
      suggestionsCount: searchResults.suggestions.length
    });

    return NextResponse.json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Orders Search API] Error in search request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to search orders: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Quick search using query parameters
    const query = searchParams.get('q') || '';
    const waybill = searchParams.get('waybill') || '';
    const referenceNumber = searchParams.get('ref') || '';
    const customerName = searchParams.get('customer') || '';
    const customerPhone = searchParams.get('phone') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    console.log('[Orders Search API] Quick search:', {
      query,
      waybill,
      referenceNumber,
      customerName,
      customerPhone,
      limit,
      page
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

    // Build search query
    const searchQuery: any = {
      limit,
      page
    };

    if (query) searchQuery.query = query;
    if (waybill) searchQuery.waybill = waybill;
    if (referenceNumber) searchQuery.referenceNumber = referenceNumber;
    if (customerName) searchQuery.customerName = customerName;
    if (customerPhone) searchQuery.customerPhone = customerPhone;

    // Perform search
    const searchResults = await delhiveryAPI.searchOrders(searchQuery);

    return NextResponse.json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Orders Search API] Error in GET request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to search orders: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}
