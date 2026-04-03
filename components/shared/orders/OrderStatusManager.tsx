'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Edit,
  X
} from 'lucide-react';

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (data: any) => void;
  className?: string;
}

const STATUS_COLORS = {
  'pending': 'bg-gray-100 text-gray-800',
  'processing': 'bg-blue-100 text-blue-800',
  'Confirmed': 'bg-green-100 text-green-800',
  'shipped': 'bg-purple-100 text-purple-800',
  'Dispatched': 'bg-indigo-100 text-indigo-800',
  'delivered': 'bg-emerald-100 text-emerald-800',
  'Completed': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
  'refunded': 'bg-orange-100 text-orange-800'
};

const STATUS_ICONS = {
  'pending': Clock,
  'processing': RefreshCw,
  'Confirmed': CheckCircle,
  'shipped': Truck,
  'Dispatched': Package,
  'delivered': CheckCircle,
  'Completed': CheckCircle,
  'cancelled': X,
  'refunded': AlertCircle
};

const STATUS_DESCRIPTIONS = {
  'pending': 'Order is being processed',
  'processing': 'Order is being prepared',
  'Confirmed': 'Order confirmed and ready for shipment',
  'shipped': 'Order has been shipped',
  'Dispatched': 'Order is out for delivery',
  'delivered': 'Order has been delivered',
  'Completed': 'Order completed successfully',
  'cancelled': 'Order has been cancelled',
  'refunded': 'Order has been refunded'
};

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
  orderId,
  currentStatus,
  onStatusUpdate,
  className = ''
}) => {
  const [nextStatuses, setNextStatuses] = useState<string[]>([]);
  const [canUpdateStatus, setCanUpdateStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [waybillNumber, setWaybillNumber] = useState<string>('');

  // Fetch available status updates
  const fetchStatusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment/status?orderId=${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setNextStatuses(result.data.nextStatuses || []);
        setCanUpdateStatus(result.data.canUpdateStatus || false);
      } else {
        setError(result.error || 'Failed to fetch status data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update status
  const updateStatus = async () => {
    if (!selectedStatus) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          newStatus: selectedStatus,
          waybillNumber: waybillNumber || undefined,
          reason: reason || undefined,
          updatedBy: 'admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowUpdateForm(false);
        setSelectedStatus('');
        setReason('');
        setWaybillNumber('');
        
        if (onStatusUpdate) {
          onStatusUpdate(result.order);
        }
        
        // Refresh data
        await fetchStatusData();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchStatusData();
    }
  }, [orderId]);

  const StatusIcon = STATUS_ICONS[currentStatus as keyof typeof STATUS_ICONS] || Clock;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
          {canUpdateStatus && nextStatuses.length > 0 && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <StatusIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
            }`}>
              {currentStatus}
            </span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            {STATUS_DESCRIPTIONS[currentStatus as keyof typeof STATUS_DESCRIPTIONS] || 'Status information not available'}
          </p>
        </div>

        {/* Available Next Statuses */}
        {nextStatuses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Available Status Updates:</h4>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => {
                const NextStatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || ArrowRight;
                return (
                  <div
                    key={status}
                    className="flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <NextStatusIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-700">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Update Form */}
        {showUpdateForm && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Update Order Status</h4>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select new status</option>
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Waybill Number (if moving to Dispatched) */}
              {selectedStatus === 'Dispatched' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waybill Number
                  </label>
                  <input
                    type="text"
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter waybill number"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Reason for status update"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={updateStatus}
                  disabled={updating || !selectedStatus}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => setShowUpdateForm(false)}
                  disabled={updating}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Updates Available */}
        {!canUpdateStatus && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">No status updates available for this order</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusManager;
