import { NextRequest, NextResponse } from 'next/server';
import { getOrderAnalytics } from '@/lib/database/actions/admin/analytics/analytics.actions';

export async function GET(request: NextRequest) {
  try {
    const analytics = await getOrderAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error in orders analytics API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch order analytics',
        orders: [],
        revenue: 0,
        products_sold: 0,
        average_order_value: 0,
        total_orders: 0,
        total_revenue: 0
      },
      { status: 500 }
    );
  }
}

