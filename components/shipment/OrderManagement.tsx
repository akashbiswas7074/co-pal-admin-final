'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Download,
  Filter,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface EnhancedOrder {
  waybill?: string;
  reference_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_amount?: string;
  payment_mode?: string;
  order_date?: string;
  status?: string;
  shipping_mode?: string;
  delivery_date?: string;
  trackingInfo?: {
    status: string;
    statusCode: string;
    location: string;
    timestamp: string;
    remarks: string;
    isDelivered: boolean;
    isInTransit: boolean;
    isPickedUp: boolean;
    estimatedDelivery?: string;
  };
  lastUpdate?: string;
  currentLocation?: string;
  daysSinceOrder?: number;
  isDelayed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  deliveryStatus?: string;
  [key: string]: any;
}

interface OrderAnalytics {
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  deliveryRate: number;
  cancellationRate: number;
  returnsRate: number;
  codPercentage: number;
  prepaidPercentage: number;
  topStates: Array<{ state: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; count: number; percentage: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  dailyTrends: Array<{ date: string; orders: number; amount: number }>;
  performanceMetrics: {
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
    firstAttemptDeliveryRate: number;
    customerSatisfactionScore: number;
  };
}

interface OrderManagementProps {
  selectedOrderId?: string;
}

export default function OrderManagement({ selectedOrderId }: OrderManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Orders Data
  const [orders, setOrders] = useState<EnhancedOrder[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalAmount: 0,
    totalCodAmount: 0,
    totalPrepaidAmount: 0
  });
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: '',
    paymentMode: '',
    state: '',
    city: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Fetch Orders
  const fetchOrders = async (customFilters: any = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      const allFilters = { ...filters, ...customFilters };
      Object.entries(allFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/orders?${queryParams.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders);
        setPagination(result.data.pagination);
        setSummary(result.data.summary);
        setError(null);
        
        toast({
          title: 'Orders Loaded',
          description: `Loaded ${result.data.orders.length} orders successfully`,
        });
      } else {
        setError(result.error || 'Failed to fetch orders');
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Search Orders
  const searchOrders = async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }
    
    setLoading(true);
    try {
      const searchFilters = {
        query: searchQuery.trim(),
        limit: 50,
        page: 1,
        ...filters
      };
      
      const response = await fetch('/api/orders/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery: searchFilters }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders);
        setError(null);
        
        toast({
          title: 'Search Completed',
          description: `Found ${result.data.totalResults} orders in ${result.data.searchTime}ms`,
        });
      } else {
        setError(result.error || 'Search failed');
        toast({
          title: 'Error',
          description: result.error || 'Search failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setError('Search failed');
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      
      const response = await fetch(`/api/orders/analytics?${queryParams.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
        setError(null);
        
        toast({
          title: 'Analytics Loaded',
          description: 'Order analytics loaded successfully',
        });
      } else {
        setError(result.error || 'Failed to fetch analytics');
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics');
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Bulk Actions
  const handleBulkAction = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: 'No Orders Selected',
        description: 'Please select orders to perform bulk action',
        variant: 'destructive',
      });
      return;
    }
    
    if (!bulkAction) {
      toast({
        title: 'No Action Selected',
        description: 'Please select an action to perform',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      let endpoint = '';
      let requestBody: any = {};
      
      switch (bulkAction) {
        case 'generate_waybills':
          endpoint = '/api/shipment/waybills';
          requestBody = {
            orderIds: selectedOrderIds,
            bulk: true
          };
          break;
        case 'create_pickup':
          endpoint = '/api/shipment/pickup';
          requestBody = {
            waybills: selectedOrderIds,
            pickup_date: new Date().toISOString().split('T')[0],
            pickup_time: '10:00',
            expected_package_count: selectedOrderIds.length
          };
          break;
        case 'export_csv':
          exportOrdersToCSV(orders.filter(order => 
            selectedOrderIds.includes(order.waybill || order.reference_number || '')
          ));
          setLoading(false);
          return;
        default:
          throw new Error('Invalid bulk action');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Bulk Action Completed',
          description: `Successfully performed ${bulkAction} on ${selectedOrderIds.length} orders`,
        });
        
        // Refresh orders
        fetchOrders();
        
        // Clear selection
        setSelectedOrderIds([]);
        setBulkAction('');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Bulk action failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Bulk action failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Export Orders to CSV
  const exportOrdersToCSV = (ordersToExport: EnhancedOrder[]) => {
    const csvData = ordersToExport.map(order => ({
      'Waybill': order.waybill || '',
      'Reference Number': order.reference_number || '',
      'Customer Name': order.customer_name || '',
      'Customer Phone': order.customer_phone || '',
      'Address': order.address || '',
      'City': order.city || '',
      'State': order.state || '',
      'Pincode': order.pincode || '',
      'Total Amount': order.total_amount || '',
      'Payment Mode': order.payment_mode || '',
      'Order Date': order.order_date || '',
      'Status': order.status || '',
      'Shipping Mode': order.shipping_mode || '',
      'Current Location': order.currentLocation || '',
      'Days Since Order': order.daysSinceOrder || '',
      'Is Delayed': order.isDelayed ? 'Yes' : 'No',
      'Priority': order.priority || '',
      'Delivery Status': order.deliveryStatus || ''
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Completed',
      description: `Exported ${ordersToExport.length} orders to CSV`,
    });
  };
  
  // Toggle Order Selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  // Select All Orders
  const selectAllOrders = () => {
    const allOrderIds = orders.map(order => order.waybill || order.reference_number || '').filter(Boolean);
    setSelectedOrderIds(prev => 
      prev.length === allOrderIds.length ? [] : allOrderIds
    );
  };
  
  // Get Priority Badge Color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get Status Badge Color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('cancelled') || statusLower.includes('rto')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('picked')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Load initial data
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Update pagination when page changes
  const handlePageChange = (newPage: number) => {
    fetchOrders({ page: newPage, limit: pagination.limit });
  };
  
  return (
    <div className="space-y-6">
      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{summary.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Truck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold">{summary.deliveredOrders}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold">{summary.inTransitOrders}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold">{summary.cancelledOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by waybill, reference number, customer name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchOrders()}
                />
                <Button onClick={searchOrders} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={fetchAnalytics}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={fetchOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Picked Up">Picked Up</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="RTO">RTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={filters.paymentMode} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Payment Modes</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="Prepaid">Prepaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Enter state"
                  value={filters.state}
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="minAmount">Min Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="999999"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                <Button onClick={() => fetchOrders(filters)}>
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      fromDate: '',
                      toDate: '',
                      status: '',
                      paymentMode: '',
                      state: '',
                      city: '',
                      minAmount: '',
                      maxAmount: ''
                    });
                    fetchOrders();
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Bulk Actions */}
      {selectedOrderIds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedOrderIds.length} order(s) selected
                </span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generate_waybills">Generate Waybills</SelectItem>
                    <SelectItem value="create_pickup">Create Pickup</SelectItem>
                    <SelectItem value="export_csv">Export to CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBulkAction} disabled={!bulkAction || loading}>
                  Execute Action
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedOrderIds([]);
                    setBulkAction('');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      onCheckedChange={selectAllOrders}
                    />
                  </TableHead>
                  <TableHead>Waybill</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      {loading ? 'Loading orders...' : 'No orders found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.waybill || order.reference_number}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderIds.includes(order.waybill || order.reference_number || '')}
                          onCheckedChange={() => toggleOrderSelection(order.waybill || order.reference_number || '')}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.waybill || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.reference_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.customer_phone || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.city || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.state || 'N/A'} - {order.pincode || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{order.total_amount || '0'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.payment_mode === 'COD' ? 'destructive' : 'secondary'}>
                          {order.payment_mode || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status || '')}>
                          {order.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(order.priority || '')}>
                          {order.priority || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</p>
                          {order.daysSinceOrder && (
                            <p className="text-xs text-gray-500">{order.daysSinceOrder} days ago</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Analytics Display */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Order Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.deliveryRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Delivery Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">₹{analytics.averageOrderValue.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Average Order Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{analytics.codPercentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">COD Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{analytics.performanceMetrics.averageDeliveryTime.toFixed(1)} days</p>
                <p className="text-sm text-gray-600">Avg Delivery Time</p>
              </div>
            </div>
            
            {/* Top States */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Top States</h4>
              <div className="space-y-2">
                {analytics.topStates.slice(0, 5).map((state, index) => (
                  <div key={state.state} className="flex items-center justify-between">
                    <span className="text-sm">{state.state}</span>
                    <span className="text-sm font-medium">{state.count} orders ({state.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
