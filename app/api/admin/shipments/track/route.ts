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
    
    if (!waybill) {
      return NextResponse.json({ error: "Waybill number is required" }, { status: 400 });
    }
    
    // Track shipment
    const trackingResponse = await trackShipment(waybill);
    
    if (trackingResponse.success) {
      return NextResponse.json({
        success: true,
        trackingData: trackingResponse.trackingData,
        waybill: waybill
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: trackingResponse.error,
        message: "Failed to track shipment"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to track shipment",
      details: error.message
    }, { status: 500 });
  }
}

async function trackShipment(waybill: string) {
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
    
    const response = await fetch(`${baseUrl}/api/v1/packages/json/?waybill=${waybill}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && !data.error) {
      const shipmentData = data.ShipmentData?.[0];
      
      if (shipmentData) {
        return {
          success: true,
          trackingData: {
            waybill: waybill,
            status: shipmentData.Status?.Status || 'Unknown',
            currentLocation: shipmentData.Status?.Instructions || 'In Transit',
            estimatedDeliveryDate: shipmentData.ExpectedDeliveryDate,
            cod: shipmentData.COD,
            destination: shipmentData.Destination,
            origin: shipmentData.Origin,
            scans: shipmentData.Scans || [],
            rawData: shipmentData
          },
          rawResponse: data
        };
      } else {
        return {
          success: false,
          error: "No tracking data found for this waybill",
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
