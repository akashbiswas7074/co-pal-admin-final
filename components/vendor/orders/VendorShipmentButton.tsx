'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ExternalLink } from 'lucide-react';

interface VendorShipmentButtonProps {
  orderId: string;
  orderStatus: string;
  shipmentCreated?: boolean;
  className?: string;
}

export const VendorShipmentButton: React.FC<VendorShipmentButtonProps> = ({
  orderId,
  orderStatus,
  shipmentCreated = false,
  className = ''
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canCreateShipment = orderStatus === 'Confirmed' && !shipmentCreated;
  const isShipped = shipmentCreated || orderStatus === 'Dispatched';

  const handleShipmentClick = () => {
    setLoading(true);
    router.push(`/vendor/orders/${orderId}/shipment`);
  };

  if (!canCreateShipment && !isShipped) {
    return null; // Don't show button if order is not ready for shipment
  }

  return (
    <button
      onClick={handleShipmentClick}
      disabled={loading}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
        isShipped
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : canCreateShipment
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
      } ${className}`}
    >
      <Package className="h-4 w-4 mr-2" />
      {isShipped ? 'View Shipment' : 'Create Shipment'}
      <ExternalLink className="h-3 w-3 ml-1" />
    </button>
  );
};
