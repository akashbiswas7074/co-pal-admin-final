'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
  Search,
  RefreshCw,
  Plus,
  BarChart3,
  FileText,
  Settings,
  Clock
} from 'lucide-react';

// Import the individual components
import ShipmentDashboard from '@/components/shipment/ShipmentDashboard';
import ProductionDashboard from '@/components/shipment/ProductionDashboard';
import ShipmentManagement from '@/components/shipment/ShipmentManagement';

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  total?: number; // Fallback field
  createdAt: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryAddress?: any; // Alternative address field
  shipmentCreated?: boolean;
  orderItems?: Array<{
    name: string;
    qty: number;
    quantity?: number;
  }>;
  products?: Array<{
    name: string;
    qty: number;
    quantity: number;
  }>;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

function UnifiedShipmentPageContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const getCustomerName = (order: Order) => {
    if (order.user?.name) {
      return order.user.name;
    }
    if (order.shippingAddress?.firstName || order.shippingAddress?.lastName) {
      return `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
    }
    if (order.deliveryAddress?.firstName || order.deliveryAddress?.lastName) {
      return `${order.deliveryAddress.firstName || ''} ${order.deliveryAddress.lastName || ''}`.trim();
    }
    return 'Unknown Customer';
  };

  const getOrderAmount = (order: Order) => {
    return order.totalAmount || order.total || 0;
  };

  const getShippingAddress = (order: Order) => {
    return order.shippingAddress || order.deliveryAddress || {};
  };

  const getOrderItems = (order: Order) => {
    return order.orderItems || order.products || [];
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-select order from URL parameter
  useEffect(() => {
    if (!searchParams) return; // Guard against null searchParams

    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl && orders.length > 0) {
      setSelectedOrderId(orderIdFromUrl);
      setActiveTab('orders'); // Switch to orders tab to show the selection
    }
  }, [searchParams, orders]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Shipment Page] Fetching orders from /api/admin/orders');
      const response = await fetch('/api/admin/orders');
      console.log('[Shipment Page] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Shipment Page] API error:', response.status, errorText);
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const orders = await response.json();
      console.log('[Shipment Page] Received orders:', orders);

      if (Array.isArray(orders)) {
        setOrders(orders);
        // Reset filter to 'all' to show all orders initially
        setStatusFilter('all');
      } else {
        throw new Error('Invalid response format: expected array of orders');
      }
    } catch (err: any) {
      console.error('[Shipment Page] Error fetching orders:', err);
      console.error('[Shipment Page] Error stack:', err.stack);
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
      filtered = filtered.filter(order => {
        const customerName = getCustomerName(order);
        const shippingAddress = getShippingAddress(order);
        return order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (shippingAddress.city && shippingAddress.city.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    // Filter by status - simplified logic
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        return order.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
      case 'shipped':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      case 'not processed':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const selectedOrder = orders.find(order => order._id === selectedOrderId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Unified Shipment Management</h1>
        <p className="text-gray-600">Complete end-to-end shipment solution with integrated order management, Delhivery API, and analytics</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">Total Orders</p>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="font-medium">
                  {orders.filter(o => o.shipmentCreated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Shipment</span>
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Manage Shipments</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Production Tools</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => setActiveTab('orders')}>
                  <Package className="h-4 w-4 mr-2" />
                  Browse Orders
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shipment
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setActiveTab('shipments')}>
                  <Truck className="h-4 w-4 mr-2" />
                  Manage Shipments
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setActiveTab('production')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Production Tools
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Delhivery API</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Shipment Service</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>✨ Available Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">📦 Order Management</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Order Lookup</Badge>
                    <Badge variant="outline">Status Tracking</Badge>
                    <Badge variant="outline">Filtering</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">🚚 Shipment Operations</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Create Shipments</Badge>
                    <Badge variant="outline">Track Progress</Badge>
                    <Badge variant="outline">Cancel Shipments</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">⚡ Production Tools</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Waybill Generation</Badge>
                    <Badge variant="outline">Pickup Scheduling</Badge>
                    <Badge variant="outline">Label Download</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">📊 Analytics</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Performance Metrics</Badge>
                    <Badge variant="outline">Delivery Stats</Badge>
                    <Badge variant="outline">Reports</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">🔌 API Integration</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Delhivery API</Badge>
                    <Badge variant="outline">Real-time Updates</Badge>
                    <Badge variant="outline">Error Handling</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">🔍 Serviceability</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Pincode Check</Badge>
                    <Badge variant="outline">Service Coverage</Badge>
                    <Badge variant="outline">Delivery Estimates</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Management</CardTitle>
                <Button onClick={fetchOrders} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div>
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses ({orders.length})</SelectItem>
                      {Array.from(new Set(orders.map(o => o.status.toLowerCase()))).map(status => {
                        const count = orders.filter(o => o.status.toLowerCase() === status).length;
                        const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
                        return (
                          <SelectItem key={status} value={status}>
                            {displayStatus} ({count})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Debug Info */}
              {orders.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Available statuses:</strong> {Array.from(new Set(orders.map(o => o.status))).join(', ')}
                </div>
              )}

              {/* Orders List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders found matching your criteria</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card
                      key={order._id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedOrderId === order._id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                      onClick={() => handleOrderSelect(order._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-mono text-sm font-medium">#{order._id.slice(-8)}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              {order.shipmentCreated && (
                                <Badge variant="outline">Shipped</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {getCustomerName(order)} • {getShippingAddress(order).city}, {getShippingAddress(order).state}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getOrderItems(order).map(item => `${item.name} (${item.qty || item.quantity || 1})`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{getOrderAmount(order).toLocaleString()}</p>
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
                          <p className="font-medium">{getCustomerName(selectedOrder)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(selectedOrder.status)}>
                            {selectedOrder.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-medium">₹{getOrderAmount(selectedOrder).toLocaleString()}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Shipping Address</p>
                          <div className="text-sm">
                            {(() => {
                              const addr = getShippingAddress(selectedOrder);
                              return (
                                <div>
                                  <div>{`${addr.firstName || ''} ${addr.lastName || ''}`.trim()}</div>
                                  <div>{addr.address1 || ''}</div>
                                  <div>{`${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`}</div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Shipment Tab */}
        <TabsContent value="create" className="space-y-6">
          <ShipmentDashboard selectedOrderId={selectedOrderId} />
        </TabsContent>

        {/* Manage Shipments Tab */}
        <TabsContent value="shipments" className="space-y-6">
          <ShipmentManagement />
        </TabsContent>

        {/* Production Tools Tab */}
        <TabsContent value="production" className="space-y-6">
          <ProductionDashboard selectedOrderId={selectedOrderId} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Shipment Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Total Shipments</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {orders.filter(o => o.shipmentCreated).length}
                  </p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Delivered</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status.toLowerCase() === 'delivered').length}
                  </p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-semibold">In Transit</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {orders.filter(o => ['dispatched', 'processing'].includes(o.status.toLowerCase())).length}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Advanced analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Order Notification */}
      {selectedOrder && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Order <strong>{selectedOrder._id.slice(-8)}</strong> ({getCustomerName(selectedOrder)}) selected for shipment management.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function UnifiedShipmentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <UnifiedShipmentPageContent />
    </Suspense>
  );
}
