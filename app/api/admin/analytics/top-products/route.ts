import { NextRequest, NextResponse } from 'next/server';
import { getTopSellingProducts } from '@/lib/database/actions/admin/analytics/analytics.actions';

export async function GET(request: NextRequest) {
  try {
    const products = await getTopSellingProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error in top products analytics API:', error);
    return NextResponse.json([], { status: 500 });
  }
}

