import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const waybill = url.searchParams.get('waybill');
    const pdf = url.searchParams.get('pdf') === 'true';
    const pdf_size = url.searchParams.get('pdf_size') || 'A4';
    
    if (!waybill) {
      return NextResponse.json({ error: "Waybill number is required" }, { status: 400 });
    }
    
    // Generate shipping label
    const labelResponse = await generateShippingLabel(waybill, pdf, pdf_size);
    
    if (labelResponse.success) {
      if (pdf) {
        // Return PDF link
        return NextResponse.json({
          success: true,
          pdfUrl: labelResponse.pdfUrl,
          waybill: waybill
        }, { status: 200 });
      } else {
        // Return JSON data for custom label
        return NextResponse.json({
          success: true,
          labelData: labelResponse.labelData,
          waybill: waybill
        }, { status: 200 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: labelResponse.error,
        message: "Failed to generate shipping label"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error generating shipping label:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate shipping label",
      details: error.message
    }, { status: 500 });
  }
}

async function generateShippingLabel(waybill: string, pdf: boolean, pdf_size: string) {
  try {
    const apiToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.DELHIVERY_PRODUCTION_URL 
      : 'https://staging-express.delhivery.com';
    
    if (!apiToken) {
      return {
        success: false,
        error: "Delhivery API token not configured"
      };
    }
    
    const params = new URLSearchParams({
      wbns: waybill,
      pdf: pdf.toString(),
      pdf_size: pdf_size
    });
    
    const response = await fetch(`${baseUrl}/api/p/packing_slip?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && !data.error) {
      if (pdf) {
        return {
          success: true,
          pdfUrl: data.pdf_url || data.url,
          rawResponse: data
        };
      } else {
        return {
          success: true,
          labelData: data,
          rawResponse: data
        };
      }
    } else {
      return {
        success: false,
        error: data.error || 'Delhivery API error',
        rawResponse: data
      };
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}
