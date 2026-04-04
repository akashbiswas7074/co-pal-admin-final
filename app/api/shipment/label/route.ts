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
      let contentType = 'application/pdf';
      let extension = 'pdf';
      
      if (typeof result.data === 'string' && (result.data.startsWith('http') || result.data.startsWith('https'))) {
        // If data is a URL, fetch the PDF content
        console.log('[Shipping Label API] Fetching label from URL:', result.data);
        const pdfResponse = await fetch(result.data);
        if (pdfResponse.ok) {
          pdfContent = await pdfResponse.arrayBuffer();
          const responseContentType = pdfResponse.headers.get('content-type');
          if (responseContentType && responseContentType.includes('text/html')) {
            contentType = 'text/html';
            extension = 'html';
          }
        } else {
          const errorText = await pdfResponse.text();
          console.error('[Shipping Label API] Failed to fetch PDF:', pdfResponse.status, errorText);
          throw new Error('Failed to fetch PDF from provided URL');
        }
      } else if (typeof result.data === 'string' && result.data.trim().startsWith('{')) {
        // If data is a JSON string (likely raw label data from B2C API)
        // Return it as JSON so the frontend can render it
        console.log('[Shipping Label API] Received JSON label data instead of PDF - returning JSON');
        return NextResponse.json({
          success: true,
          data: JSON.parse(result.data),
          isRawData: true,
          waybill
        });
      } else if (typeof result.data === 'string') {
        // If data is not a URL, check if it's HTML
        if (result.data.trim().startsWith('<')) {
          contentType = 'text/html';
          extension = 'html';
        }
        pdfContent = result.data;
      } else if (typeof result.data === 'object') {
        // If it's already an object, return as JSON
        return NextResponse.json({
          success: true,
          data: result.data,
          isRawData: true,
          waybill
        });
      }

      return new NextResponse(pdfContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="shipping-label-${waybill}-${pdf_size}.${extension}"`
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
