import { Suspense } from 'react';
import ShipmentPageClient from '@/components/admin/orders/ShipmentPageClient';
import OrderStatusManager from '@/components/shared/orders/OrderStatusManager';
import { RefreshCw } from 'lucide-react';

export default async function ShipmentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading order details...</span>
        </div>
      </div>
    }>
      <ShipmentPageClient orderId={orderId} />
    </Suspense>
  );
}
