import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '@/lib/shipment/shipment-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const pdf = searchParams.get('pdf') === 'true';
    const pdf_size = (searchParams.get('pdf_size') as 'A4' | '4R') || '4R';
    
    if (!waybill) {
      return NextResponse.json(
        { success: false, error: 'Waybill number is required' },
        { status: 400 }
      );
    }

    console.log('[Shipping Label API] Generating label:', { waybill, pdf, pdf_size });

    const result = await shipmentService.generateShippingLabel(waybill, { pdf, pdf_size });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    if (pdf) {
      // If PDF is requested and we have a URL, fetch the PDF content
      let pdfContent = result.data;
      
      if (typeof result.data === 'string' && result.data.startsWith('http')) {
        // If data is a URL, fetch the PDF content
        const pdfResponse = await fetch(result.data);
        if (pdfResponse.ok) {
          pdfContent = await pdfResponse.arrayBuffer();
        } else {
          throw new Error('Failed to fetch PDF from provided URL');
        }
      } else if (typeof result.data === 'string') {
        // If data is not a URL, it might be base64 or raw data
        pdfContent = result.data;
      }

      return new NextResponse(pdfContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="shipping-label-${waybill}-${pdf_size}.pdf"`
        }
      });
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error: any) {
    console.error('[Shipping Label API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate shipping label' 
      },
      { status: 500 }
    );
  }
}
