import { NextRequest, NextResponse } from 'next/server';

/**
 * Delhivery Document Download API
 * Downloads various document types from Delhivery
 * 
 * Supported Document Types:
 * - LABEL: Shipping Label
 * - SIGNATURE_URL: Delivery Signature
 * - RVP_QC_IMAGE: Quality Check Image
 * - EPOD: Electronic POD
 * - SELLER_RETURN_IMAGE: Return Image
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill');
    const doc_type = searchParams.get('doc_type');

    if (!waybill || !doc_type) {
      return NextResponse.json({
        success: false,
        error: 'Both waybill and doc_type parameters are required'
      }, { status: 400 });
    }

    // Validate document type
    const validDocTypes = ['LABEL', 'SIGNATURE_URL', 'RVP_QC_IMAGE', 'EPOD', 'SELLER_RETURN_IMAGE'];
    if (!validDocTypes.includes(doc_type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid document type. Allowed types: ${validDocTypes.join(', ')}`
      }, { status: 400 });
    }

    console.log('[Delhivery Document API] Fetching document:', { waybill, doc_type });

    // Call Delhivery Document API
    const delhiveryUrl = `https://track.delhivery.com/api/rest/fetch/pkg/document/?doc_type=${doc_type}&waybill=${waybill}`;
    
    const delhiveryResponse = await fetch(delhiveryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const delhiveryResult = await delhiveryResponse.json();
    console.log('[Delhivery Document API] Response:', delhiveryResult);

    if (!delhiveryResponse.ok) {
      throw new Error(`Delhivery API error: ${delhiveryResult.message || 'Document not available'}`);
    }

    // Extract document URL from response
    let documentUrl = null;
    
    if (delhiveryResult.documents && delhiveryResult.documents.length > 0) {
      documentUrl = delhiveryResult.documents[0].url || delhiveryResult.documents[0].document_url;
    } else if (delhiveryResult.url) {
      documentUrl = delhiveryResult.url;
    } else if (delhiveryResult.document_url) {
      documentUrl = delhiveryResult.document_url;
    }

    if (!documentUrl) {
      return NextResponse.json({
        success: false,
        error: `${doc_type} document not available for this waybill`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${doc_type} document retrieved successfully`,
      data: {
        waybillNumber: waybill,
        documentType: doc_type,
        documentUrl: documentUrl,
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Delhivery Document API] Error:', error);
    
    const { searchParams } = new URL(request.url);
    const doc_type = searchParams.get('doc_type');
    
    return NextResponse.json({
      success: false,
      error: error.message || `Failed to fetch ${doc_type || 'document'}`
    }, { status: 500 });
  }
}
