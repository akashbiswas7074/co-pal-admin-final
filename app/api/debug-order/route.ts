import { NextResponse } from 'next/server';
import Order from '@/lib/database/models/order.model';
import { connectToDatabase } from '@/lib/database/connect';

export async function GET(req: any) {
  try {
    await connectToDatabase();
    const orderId = '69d0facd716655ed9118e211';
    const order = await Order.findById(orderId).lean() as any;
    
    if (!order) return NextResponse.json({ error: 'Order not found' });
    
    return NextResponse.json({
      id: order._id,
      shipmentDetails: order.shipmentDetails,
      orderItemsWaybills: order.orderItems?.map((i: any) => i.waybillNumber).filter(Boolean),
      productsWaybills: order.products?.map((i: any) => i.waybillNumber).filter(Boolean),
      itemStatus: order.orderItems?.map((i: any) => ({ name: i.name, status: i.status })),
      productStatus: order.products?.map((i: any) => ({ name: i.name, status: i.status }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
