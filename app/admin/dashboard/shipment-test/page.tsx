'use client';

import { useState } from 'react';
import { ShipmentManager } from '@/components/shared/shipment/ShipmentManager';
import { Package, TestTube, RefreshCw } from 'lucide-react';

export default function ShipmentTestPage() {
  const [orderId, setOrderId] = useState<string>('');
  const [showManager, setShowManager] = useState<boolean>(false);

  const testOrderIds = [
    '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId format
    '507f1f77bcf86cd799439012',
    '507f1f77bcf86cd799439013'
  ];

  const handleShipmentCreated = (data?: any) => {
    console.log('Shipment created:', data);
    // You can add notification logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <TestTube className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shipment Manager Test</h1>
              <p className="text-gray-600">Test the enhanced Delhivery shipment creation system</p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter order ID to test"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setShowManager(!!orderId)}
                  disabled={!orderId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Load Shipment Manager
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Test Order IDs
              </label>
              <div className="flex flex-wrap gap-2">
                {testOrderIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setOrderId(id);
                      setShowManager(true);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Forward Shipment</h3>
              <p className="text-sm text-blue-700">Standard B2C delivery with automatic waybill generation</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Reverse Shipment</h3>
              <p className="text-sm text-orange-700">Return pickup (RVP) for product returns</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Replacement</h3>
              <p className="text-sm text-purple-700">Exchange shipment (REPL) for product replacement</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Multi-Package</h3>
              <p className="text-sm text-green-700">MPS shipments with multiple packages</p>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Shipment Settings</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fragile shipment handling</li>
                <li>• Dangerous goods classification</li>
                <li>• Plastic packaging options</li>
                <li>• Custom dimensions & weight</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Compliance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• HSN code integration</li>
                <li>• E-waybill support (₹50k+)</li>
                <li>• GST-compliant invoicing</li>
                <li>• Real-time validation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Tracking & Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time tracking</li>
                <li>• Waybill generation</li>
                <li>• Status updates</li>
                <li>• Delivery confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shipment Manager Component */}
        {showManager && orderId && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipment Manager - Order: {orderId}
                </h2>
                <button
                  onClick={() => setShowManager(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ShipmentManager
                orderId={orderId}
                onShipmentCreated={handleShipmentCreated}
              />
            </div>
          </div>
        )}

        {/* API Endpoints Info */}
        <div className="bg-gray-900 rounded-lg text-white p-6">
          <h2 className="text-lg font-semibold mb-4">API Endpoints</h2>
          
          <div className="space-y-3 text-sm font-mono">
            <div className="flex">
              <span className="text-green-400 w-16">GET</span>
              <span>/api/shipment?orderId=...</span>
              <span className="ml-auto text-gray-400">Fetch shipment data</span>
            </div>
            <div className="flex">
              <span className="text-blue-400 w-16">POST</span>
              <span>/api/shipment</span>
              <span className="ml-auto text-gray-400">Create shipment</span>
            </div>
            <div className="flex">
              <span className="text-purple-400 w-16">POST</span>
              <span>/api/shipment/waybills</span>
              <span className="ml-auto text-gray-400">Generate waybills</span>
            </div>
            <div className="flex">
              <span className="text-yellow-400 w-16">GET</span>
              <span>/api/shipment/track</span>
              <span className="ml-auto text-gray-400">Track shipment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
