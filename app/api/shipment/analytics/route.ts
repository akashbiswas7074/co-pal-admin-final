import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

/**
 * Shipment Analytics API
 * Provides comprehensive analytics and insights for shipments
 */

export async function GET(request: NextRequest) {
  console.log('[Shipment Analytics API] GET request received');
  
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log('[Shipment Analytics API] Analyzing data from', startDate, 'to', endDate);
    
    // Get all orders with shipments in the date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { shipmentCreated: true },
        { reverseShipment: { $exists: true } },
        { replacementShipment: { $exists: true } }
      ]
    }).lean();
    
    console.log('[Shipment Analytics API] Found', orders.length, 'orders with shipments');
    
    // Calculate basic metrics
    const totalShipments = orders.length;
    const deliveredShipments = orders.filter(order => 
      order.status?.toLowerCase() === 'delivered' || 
      order.status?.toLowerCase() === 'completed'
    ).length;
    const inTransitShipments = orders.filter(order => 
      order.status?.toLowerCase() === 'dispatched' ||
      order.status?.toLowerCase() === 'shipped'
    ).length;
    const cancelledShipments = orders.filter(order => 
      order.status?.toLowerCase() === 'cancelled'
    ).length;
    
    const deliveryRate = totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;
    
    // Calculate average delivery time (mock data for demo)
    const avgDeliveryTime = 3.5; // In days
    
    // Calculate financial metrics (mock data for demo)
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
    const costSavings = totalRevenue * 0.15; // Assume 15% savings through efficient logistics
    
    // Daily shipments trend
    const dailyShipments = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      const dayDelivered = dayOrders.filter(order => 
        order.status?.toLowerCase() === 'delivered' || 
        order.status?.toLowerCase() === 'completed'
      ).length;
      
      dailyShipments.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayOrders.length,
        delivered: dayDelivered
      });
    }
    
    // Location-based statistics
    const locationMap = new Map();
    orders.forEach(order => {
      const location = order.shipmentDetails?.pickupLocation || 
                     order.reverseShipment?.pickupLocation || 
                     order.replacementShipment?.pickupLocation || 
                     'Unknown';
      
      if (!locationMap.has(location)) {
        locationMap.set(location, { count: 0, delivered: 0 });
      }
      
      const stats = locationMap.get(location);
      stats.count++;
      
      if (order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed') {
        stats.delivered++;
      }
    });
    
    const locationStats = Array.from(locationMap.entries()).map(([location, stats]) => ({
      location,
      count: stats.count,
      deliveryRate: stats.count > 0 ? (stats.delivered / stats.count) * 100 : 0
    })).sort((a, b) => b.count - a.count);
    
    // Shipment type statistics
    const typeMap = new Map();
    orders.forEach(order => {
      let type = 'FORWARD';
      
      if (order.reverseShipment) type = 'REVERSE';
      else if (order.replacementShipment) type = 'REPLACEMENT';
      else if (order.shipmentDetails?.shipmentType === 'MPS') type = 'MPS';
      
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    
    const typeStats = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalShipments > 0 ? (count / totalShipments) * 100 : 0
    })).sort((a, b) => b.count - a.count);
    
    // Performance metrics (mock data for demo)
    const performanceMetrics = {
      onTimeDelivery: Math.min(95, deliveryRate + Math.random() * 5),
      customerSatisfaction: Math.min(98, 85 + Math.random() * 13),
      returnRate: Math.max(1, Math.random() * 5),
      damageRate: Math.max(0.5, Math.random() * 2)
    };
    
    const analytics = {
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      cancelledShipments,
      deliveryRate,
      avgDeliveryTime,
      totalRevenue,
      costSavings,
      dailyShipments,
      locationStats,
      typeStats,
      performanceMetrics
    };
    
    console.log('[Shipment Analytics API] Analytics calculated:', {
      totalShipments,
      deliveryRate,
      locationCount: locationStats.length,
      typeCount: typeStats.length
    });
    
    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        },
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[Shipment Analytics API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
