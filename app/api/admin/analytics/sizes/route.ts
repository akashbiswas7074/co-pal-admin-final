import { NextRequest, NextResponse } from 'next/server';
import { sizeAnalytics } from '@/lib/database/actions/admin/analytics/analytics.actions';

export async function GET(request: NextRequest) {
  try {
    const sizes = await sizeAnalytics();
    return NextResponse.json(sizes);
  } catch (error: any) {
    console.error('Error in size analytics API:', error);
    return NextResponse.json([], { status: 500 });
  }
}

