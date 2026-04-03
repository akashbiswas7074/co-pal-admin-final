'use client';

import { ComprehensiveShipmentManager } from '@/components/shared/shipment/ComprehensiveShipmentManager';

export default function ShipmentDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ComprehensiveShipmentManager mode="dashboard" />
      </div>
    </div>
  );
}
