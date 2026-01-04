'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ArrowLeft, 
  User, 
  MapPin, 
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { ShipmentManager } from '@/components/shared/shipment/ShipmentManager';
import OrderStatusManager from '@/components/shared/orders/OrderStatusManager';

interface OrderDetails {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  orderItems: Array<{
    name: string;
    image: string;
    price: number;
    qty: number;
    status: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
  shipmentCreated?: boolean;
}

interface ShipmentPageClientProps {
  orderId: string;
}

export default function ShipmentPageClient({ orderId }: ShipmentPageClientProps) {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setOrderDetails(result.order);
      } else {
        setError(result.error || 'Failed to fetch order details');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentCreated = (data: any) => {
    console.log('Shipment created:', data);
    // Refresh order details
    fetchOrderDetails();
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrderDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shipment Management</h1>
              <p className="text-gray-600 mt-1">Order #{orderId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                orderDetails.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                orderDetails.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                orderDetails.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {orderDetails.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{orderDetails.user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{orderDetails.user.email}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">
                  {orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}
                </p>
                <p className="text-gray-700">{orderDetails.shippingAddress.phoneNumber}</p>
                <p className="text-gray-700">
                  {orderDetails.shippingAddress.address1}
                  {orderDetails.shippingAddress.address2 && `, ${orderDetails.shippingAddress.address2}`}
                </p>
                <p className="text-gray-700">
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                </p>
                <p className="text-gray-700">{orderDetails.shippingAddress.country}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-4">
                {orderDetails.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">Qty: {item.qty}</span>
                        <span className="text-sm text-gray-600">₹{item.price}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          item.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="ml-auto font-semibold text-gray-900">₹{orderDetails.total}</span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="ml-auto text-gray-900 capitalize">{orderDetails.paymentMethod}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <span className="ml-auto text-gray-900">
                    {new Date(orderDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status Manager */}
            <OrderStatusManager
              orderId={orderId}
              currentStatus={orderDetails.status}
              onStatusUpdate={handleShipmentCreated}
            />

            {/* Shipment Manager */}
            <ShipmentManager
              orderId={orderId}
              onShipmentCreated={handleShipmentCreated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
