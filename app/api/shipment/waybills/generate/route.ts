import { NextRequest, NextResponse } from 'next/server';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

export async function POST(request: NextRequest) {
  try {
    const { count = 5 } = await request.json();
    
    console.log('[Waybill API] Generating waybills:', { count });
    
    // Validate count
    if (count < 1 || count > 25) {
      return NextResponse.json({
        success: false,
        error: 'Count must be between 1 and 25'
      }, { status: 400 });
    }

    let waybills: string[] = [];

    if (delhiveryAPI.isConfigured()) {
      try {
        // Try to generate waybills using Delhivery API
        console.log('[Waybill API] Using Delhivery API to generate waybills');
        waybills = await delhiveryAPI.generateWaybills(count);
        
      } catch (apiError: any) {
        console.warn('[Waybill API] Delhivery API failed, generating demo waybills:', apiError.message);
        // Fallback to demo waybills if API fails
        waybills = generateDemoWaybills(count);
      }
    } else {
      console.log('[Waybill API] Delhivery API not configured, generating demo waybills');
      waybills = generateDemoWaybills(count);
    }

    return NextResponse.json({
      success: true,
      data: {
        waybills,
        count: waybills.length,
        generatedAt: new Date().toISOString()
      },
      waybills // Legacy format for backward compatibility
    });

  } catch (error: any) {
    console.error('[Waybill API] Error generating waybills:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate waybills'
    }, { status: 500 });
  }
}

function generateDemoWaybills(count: number): string[] {
  const waybills = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const waybill = `DEMO_WB_${timestamp}_${i.toString().padStart(3, '0')}`;
    waybills.push(waybill);
  }
  
  console.log('[Waybill API] Generated demo waybills:', waybills);
  return waybills;
}
