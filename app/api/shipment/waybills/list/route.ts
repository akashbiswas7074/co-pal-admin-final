import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Shipment from '@/lib/database/models/shipment.model';

/**
 * Waybill Numbers List API
 * Returns all available waybill numbers for dropdowns and selection
 */

export async function GET(request: NextRequest) {
  console.log('[Waybill List API] GET request received');
  
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Build query
    const query: any = { isActive: true };
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Get shipments with waybill numbers
    const shipments = await Shipment.find(query)
      .select('primaryWaybill waybillNumbers status shipmentType customerDetails.name orderId createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Extract all unique waybill numbers
    const waybillData = [];
    const waybillSet = new Set();
    
    shipments.forEach(shipment => {
      // Add primary waybill
      if (shipment.primaryWaybill && !waybillSet.has(shipment.primaryWaybill)) {
        waybillSet.add(shipment.primaryWaybill);
        waybillData.push({
          waybillNumber: shipment.primaryWaybill,
          shipmentId: shipment._id,
          orderId: shipment.orderId,
          status: shipment.status,
          shipmentType: shipment.shipmentType,
          customerName: shipment.customerDetails?.name || 'Unknown',
          createdAt: shipment.createdAt,
          isPrimary: true
        });
      }
      
      // Add additional waybill numbers
      if (shipment.waybillNumbers && Array.isArray(shipment.waybillNumbers)) {
        shipment.waybillNumbers.forEach(waybill => {
          if (waybill && !waybillSet.has(waybill)) {
            waybillSet.add(waybill);
            waybillData.push({
              waybillNumber: waybill,
              shipmentId: shipment._id,
              orderId: shipment.orderId,
              status: shipment.status,
              shipmentType: shipment.shipmentType,
              customerName: shipment.customerDetails?.name || 'Unknown',
              createdAt: shipment.createdAt,
              isPrimary: false
            });
          }
        });
      }
    });
    
    // Sort waybill data by creation date (newest first)
    waybillData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Extract just the waybill numbers for simple dropdown
    const waybillNumbers = waybillData.map(item => item.waybillNumber);
    
    console.log(`[Waybill List API] Found ${waybillNumbers.length} waybill numbers`);
    
    return NextResponse.json({
      success: true,
      data: {
        waybillNumbers,
        waybillDetails: waybillData,
        total: waybillNumbers.length
      }
    });
    
  } catch (error: any) {
    console.error('[Waybill List API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch waybill numbers'
    }, { status: 500 });
  }
}
