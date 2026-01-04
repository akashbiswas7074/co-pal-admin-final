'use client';

import { useState, useEffect } from 'react';
import ShipmentDashboard from '@/components/shipment/ShipmentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Package, Truck, AlertCircle, Search, RefreshCw } from 'lucide-react';

interface Order {
  _id: string;
  status: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  shipmentCreated?: boolean;
  orderItems: Array<{
    name: string;
    qty: number;
  }>;
}

export default function ShipmentDemoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOrderSelector, setShowOrderSelector] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Invalid response format');
      }

      setOrders(result.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderSelector(false);
  };

  const selectedOrder = orders.find(order => order._id === selectedOrderId);
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Shipment Management System</h1>
        <p className="text-gray-600">Complete shipment management solution with Delhivery API integration</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="font-medium text-green-600">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Available Orders</p>
                <p className="font-medium">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Ready for Shipment</p>
                <p className="font-medium">
                  {orders.filter(o => ['Confirmed', 'Processing'].includes(o.status) && !o.shipmentCreated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Selection</CardTitle>
            <Button
              onClick={() => setShowOrderSelector(!showOrderSelector)}
              variant="outline"
            >
              {showOrderSelector ? 'Hide Orders' : 'Select Order'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showOrderSelector && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Orders</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by Order ID, Customer Name, or City..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="status">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchOrders} disabled={loading} variant="outline">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Orders List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders found
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card 
                      key={order._id} 
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedOrderId === order._id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleOrderSelect(order._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Order #{order._id.slice(-8)}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              {order.shipmentCreated && (
                                <Badge variant="outline">Shipped</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.customerName} • {order.shippingAddress.city}, {order.shippingAddress.state}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.orderItems.map(item => `${item.name} (${item.qty})`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{order.totalAmount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selected Order Display */}
          {selectedOrder && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Selected Order</h3>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-mono text-sm">{selectedOrder._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Shipping Address</p>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}<br />
                        {selectedOrder.shippingAddress.address1}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Features Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">📦 Shipment Types</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">FORWARD</Badge>
                <Badge variant="outline">REVERSE</Badge>
                <Badge variant="outline">REPLACEMENT</Badge>
                <Badge variant="outline">MPS</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🚚 Shipping Modes</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">Surface</Badge>
                <Badge variant="outline">Express</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🔧 Special Features</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">Fragile Handling</Badge>
                <Badge variant="outline">HSN Codes</Badge>
                <Badge variant="outline">Real-time Tracking</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">📊 Management</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">Bulk Operations</Badge>
                <Badge variant="outline">Status Updates</Badge>
                <Badge variant="outline">Analytics</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🔐 Security</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">API Authentication</Badge>
                <Badge variant="outline">Data Validation</Badge>
                <Badge variant="outline">Error Handling</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🌟 Integration</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">Order Management</Badge>
                <Badge variant="outline">Warehouse System</Badge>
                <Badge variant="outline">Customer Portal</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Status */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode Active:</strong> The system is running in demo mode with mock data. 
          To use live Delhivery API, configure your API credentials in the environment variables.
          {selectedOrder && (
            <span className="block mt-2 text-blue-800">
              ✨ Order <strong>{selectedOrder._id.slice(-8)}</strong> selected for shipment creation!
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Main Dashboard */}
      {selectedOrderId ? (
        <ShipmentDashboard selectedOrderId={selectedOrderId} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>🚀 Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select an Order to Begin</h3>
              <p className="text-gray-600 mb-4">
                Choose an order from the list above to start creating shipments.
              </p>
              <Button onClick={() => setShowOrderSelector(true)}>
                Browse Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Create Shipment</h3>
            <p className="text-gray-600">
              Click "Create Shipment" to start the shipment creation process. Enter an order ID and configure shipment settings.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">2. Track Shipments</h3>
            <p className="text-gray-600">
              Use the tracking feature to monitor shipment progress. Click on waybill numbers to view detailed tracking information.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">3. Manage Shipments</h3>
            <p className="text-gray-600">
              View all shipments in the dashboard, filter by status, and manage individual shipments as needed.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">4. API Integration</h3>
            <p className="text-gray-600">
              Configure your Delhivery API credentials in the environment variables to enable live shipment creation and tracking.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>📡 API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Shipment Management</h3>
              <ul className="text-sm space-y-1">
                <li><code>POST /api/shipment/create</code> - Create shipment</li>
                <li><code>GET /api/shipment/details</code> - Get shipment details</li>
                <li><code>PUT /api/shipment/manage</code> - Edit shipment</li>
                <li><code>DELETE /api/shipment/manage</code> - Cancel shipment</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Tracking & Utilities</h3>
              <ul className="text-sm space-y-1">
                <li><code>GET /api/shipment/tracking</code> - Track shipment</li>
                <li><code>POST /api/shipment/waybill</code> - Generate waybills</li>
                <li><code>GET /api/warehouse</code> - Get warehouses</li>
                <li><code>POST /api/warehouse</code> - Create warehouse</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
