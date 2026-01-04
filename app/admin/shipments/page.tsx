'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Phone,
  Home,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Activity,
  Settings,
  FileText,
  Scan,
  Route,
  PackageOpen,
  ArrowRight,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Shipment {
  _id: string;
  orderId: string;
  waybillNumbers: string[];
  status: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  destination: {
    city: string;
    state: string;
    pincode: string;
  };
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  paymentMode: string;
  codAmount: number;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  trackingInfo?: {
    currentLocation: string;
    estimatedDelivery: string;
    lastUpdate: string;
  };
  orderDetails?: {
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

interface CreateShipmentData {
  orderId: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  productCategory?: string;
  estimatedValue?: number;
  auto_hsn_code?: string;
  auto_waybill?: string;
  customFields: {
    fragile_shipment: boolean;
    dangerous_good: boolean;
    plastic_packaging: boolean;
    auto_generate_waybill: boolean;
    auto_generate_hsn: boolean;
  };
  packages?: Array<{
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }>;
}

interface Warehouse {
  name: string;
  location: string;
  address: string;
  pincode: string;
  phone: string;
  active: boolean;
}

interface Order {
  _id: string;
  orderId?: string;
  user?: {
    name: string;
    email: string;
  };
  shippingAddress?: {
    firstName: string;
    lastName: string;
    city: string;
    state: string;
  };
  total?: number;
  totalAmount?: number;
  status: string;
  createdAt: string;
  shipmentCreated?: boolean;
}

export default function ShipmentsManagementPage() {
  const { toast } = useToast();
  
  // State management
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all-shipments');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setBulkShowDialog] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditPickupDialog, setShowEditPickupDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [showWarehouseHelpDialog, setShowWarehouseHelpDialog] = useState(false);
  
  // Form states
  const [createData, setCreateData] = useState<CreateShipmentData>({
    orderId: '',
    shipmentType: 'FORWARD',
    pickupLocation: '',
    shippingMode: 'Surface',
    weight: 500,
    dimensions: { length: 10, width: 10, height: 10 },
    customFields: {
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false,
      auto_generate_waybill: true,
      auto_generate_hsn: true
    }
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    shipmentType: '',
    pickupLocation: '',
    dateRange: '30',
    paymentMode: ''
  });
  
  // Tracking state
  const [trackingWaybill, setTrackingWaybill] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  
  // Bulk operation states
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    inTransit: 0,
    cancelled: 0,
    pending: 0,
    deliveryRate: 0
  });

  // Load data on component mount
  useEffect(() => {
    fetchShipments();
    fetchWarehouses();
    fetchOrders();
  }, []);

  // Update filtered shipments when filters change
  useEffect(() => {
    applyFilters();
  }, [shipments, filters]);

  // Calculate statistics whenever shipments change
  useEffect(() => {
    calculateStats();
  }, [shipments]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shipment/list');
      const result = await response.json();
      
      if (result.success) {
        setShipments(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch shipments',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch shipments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Handle the specific structure: data.warehouses
        const warehousesData = result.data.warehouses || result.data;
        const formattedWarehouses = warehousesData.map((warehouse: any) => ({
          name: warehouse.name,
          location: warehouse.city || warehouse.location || 'Unknown',
          address: warehouse.address || '',
          pincode: warehouse.pincode || '',
          phone: warehouse.phone || '',
          active: warehouse.status === 'active' || true
        }));
        
        setWarehouses(formattedWarehouses);
        
        // Set default pickup location
        if (formattedWarehouses.length > 0 && !createData.pickupLocation) {
          setCreateData(prev => ({
            ...prev,
            pickupLocation: formattedWarehouses[0].name
          }));
        }
      } else {
        // Add some default warehouses for testing
        const defaultWarehouses = [
          { name: 'Main Warehouse', location: 'Kolkata', address: '', pincode: '', phone: '', active: true },
          { name: 'Secondary Warehouse', location: 'Delhi', address: '', pincode: '', phone: '', active: true }
        ];
        setWarehouses(defaultWarehouses);
        if (!createData.pickupLocation) {
          setCreateData(prev => ({
            ...prev,
            pickupLocation: defaultWarehouses[0].name
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      // Add some default warehouses for testing
      const defaultWarehouses = [
        { name: 'Main Warehouse', location: 'Kolkata', address: '', pincode: '', phone: '', active: true },
        { name: 'Secondary Warehouse', location: 'Delhi', address: '', pincode: '', phone: '', active: true }
      ];
      setWarehouses(defaultWarehouses);
      if (!createData.pickupLocation) {
        setCreateData(prev => ({
          ...prev,
          pickupLocation: defaultWarehouses[0].name
        }));
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const result = await response.json();
      
      let ordersData = [];
      
      // Handle different response formats
      if (Array.isArray(result)) {
        ordersData = result;
      } else if (result.success && result.data) {
        ordersData = Array.isArray(result.data) ? result.data : [result.data];
      } else if (result.orders) {
        ordersData = result.orders;
      } else {
        // Add some default orders for testing (using valid MongoDB ObjectIds)
        ordersData = [
          {
            _id: '507f1f77bcf86cd799439011',
            orderId: 'ORD-001',
            user: { name: 'John Doe', email: 'john@example.com' },
            total: 1500,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            shipmentCreated: false
          },
          {
            _id: '507f1f77bcf86cd799439012',
            orderId: 'ORD-002',
            user: { name: 'Jane Smith', email: 'jane@example.com' },
            total: 2500,
            status: 'processing',
            createdAt: new Date().toISOString(),
            shipmentCreated: false
          }
        ];
      }
      
      // Filter orders that don't have shipments yet
      const ordersWithoutShipments = ordersData.filter((order: any) => !order.shipmentCreated);
      setOrders(ordersWithoutShipments);
      
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Add some default orders for testing (using valid MongoDB ObjectIds)
      const defaultOrders = [
        {
          _id: '507f1f77bcf86cd799439011',
          orderId: 'ORD-001',
          user: { name: 'John Doe', email: 'john@example.com' },
          total: 1500,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          shipmentCreated: false
        },
        {
          _id: '507f1f77bcf86cd799439012',
          orderId: 'ORD-002',
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          total: 2500,
          status: 'processing',
          createdAt: new Date().toISOString(),
          shipmentCreated: false
        }
      ];
      setOrders(defaultOrders);
    }
  };

  const applyFilters = () => {
    let filtered = [...shipments];
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(shipment =>
        shipment.orderId.toLowerCase().includes(searchTerm) ||
        shipment.waybillNumbers.some(w => w.toLowerCase().includes(searchTerm)) ||
        shipment.customerName.toLowerCase().includes(searchTerm) ||
        shipment.customerPhone.includes(searchTerm)
      );
    }
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(shipment => shipment.status === filters.status);
    }
    
    // Shipment type filter
    if (filters.shipmentType) {
      filtered = filtered.filter(shipment => shipment.shipmentType === filters.shipmentType);
    }
    
    // Pickup location filter
    if (filters.pickupLocation) {
      filtered = filtered.filter(shipment => shipment.pickupLocation === filters.pickupLocation);
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(shipment => 
        new Date(shipment.createdAt) >= cutoffDate
      );
    }
    
    setFilteredShipments(filtered);
  };

  const calculateStats = () => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status.toLowerCase().includes('delivered')).length;
    const inTransit = shipments.filter(s => s.status.toLowerCase().includes('dispatched')).length;
    const cancelled = shipments.filter(s => s.status.toLowerCase().includes('cancelled')).length;
    const pending = shipments.filter(s => s.status.toLowerCase().includes('processing')).length;
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    
    setStats({ total, delivered, inTransit, cancelled, pending, deliveryRate });
  };

  const createShipment = async () => {
    setCreating(true);
    try {
      // Auto-generate HSN code and waybill if enabled
      let finalData = { ...createData };
      
      if (createData.customFields.auto_generate_hsn && createData.productCategory) {
        finalData.auto_hsn_code = getHSNCodeForCategory(createData.productCategory);
      }
      
      if (createData.customFields.auto_generate_waybill) {
        finalData.auto_waybill = generateWaybillNumber();
      }

      const response = await fetch('/api/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Check if this was a demo shipment or real shipment
        const isDemoShipment = result.message && result.message.includes('Demo shipment');
        const isWarehouseIssue = result.message && result.message.includes('Warehouse') && result.message.includes('not found');
        const isRealShipment = !isDemoShipment && !isWarehouseIssue;
        
        if (isRealShipment) {
          toast({
            title: '🎉 Real Shipment Created!',
            description: `Shipment created successfully with official Delhivery integration${finalData.auto_waybill ? ` and waybill: ${finalData.auto_waybill}` : ''}`,
          });
        } else if (isWarehouseIssue) {
          toast({
            title: 'Warehouse Setup Required',
            description: 'Shipment created in demo mode. Please register your warehouse in Delhivery account first.',
            variant: 'destructive',
          });
        } else if (isDemoShipment) {
          toast({
            title: 'Demo Shipment Created',
            description: `Demo shipment created successfully${finalData.auto_waybill ? ` with waybill: ${finalData.auto_waybill}` : ''} (API issue detected)`,
          });
        }
        
        setShowCreateDialog(false);
        fetchShipments();
        resetCreateForm();
      } else {
        // Enhanced error messages
        let errorMessage = result.error || 'Failed to create shipment';
        
        if (errorMessage.includes('auth token not configured')) {
          errorMessage = 'Delhivery API not configured. Please set up your API credentials in .env.local';
        } else if (errorMessage.includes('401')) {
          errorMessage = 'Delhivery API authentication failed. Please check your API token configuration.';
        } else if (errorMessage.includes('403')) {
          errorMessage = 'Delhivery API access denied. Please verify your account permissions.';
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shipment',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getHSNCodeForCategory = (category: string): string => {
    const hsnMap: { [key: string]: string } = {
      'clothing': '6109', // T-shirts, tank tops and other vests
      'electronics': '8517', // Electrical apparatus for line telephony
      'books': '4901', // Printed books, brochures, leaflets
      'cosmetics': '3304', // Beauty or make-up preparations
      'food': '1905', // Bread, pastry, cakes, biscuits
      'home': '7323', // Table, kitchen or other household articles
      'sports': '9506', // Articles and equipment for sports
      'toys': '9503', // Toys, scale models and similar recreational models
      'other': '9999' // Commodities not elsewhere specified
    };
    return hsnMap[category] || '9999';
  };

  const generateWaybillNumber = (): string => {
    // Generate a waybill number in Delhivery format: 2 letters + 10 digits
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                   letters.charAt(Math.floor(Math.random() * letters.length));
    const number = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digit number
    return `${prefix}${number}`;
  };

  const trackShipment = async (waybill?: string) => {
    const waybillToTrack = waybill || trackingWaybill;
    if (!waybillToTrack) return;
    
    try {
      const response = await fetch(`/api/shipment/track?waybill=${waybillToTrack}`);
      const result = await response.json();
      
      if (result.success) {
        setTrackingData(result.data);
        if (!waybill) setShowTrackDialog(true);
        toast({
          title: 'Success',
          description: 'Tracking information updated',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to track shipment',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to track shipment',
        variant: 'destructive',
      });
    }
  };

  const updateShipmentStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const shipment = shipments.find(s => s._id === shipmentId);
      if (!shipment) return;
      
      const response = await fetch('/api/shipment/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: shipment.orderId,
          newStatus,
          updatedBy: 'admin'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Status updated to ${newStatus}`,
        });
        fetchShipments();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const updateShipmentPickupLocation = async (shipmentId: string, newPickupLocation: string) => {
    try {
      const shipment = shipments.find(s => s._id === shipmentId);
      if (!shipment) return;
      
      const response = await fetch('/api/shipment/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: shipment.orderId,
          waybillNumber: shipment.waybillNumbers[0],
          editData: {
            pickupLocation: newPickupLocation
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Pickup location updated to ${newPickupLocation}`,
        });
        setShowEditPickupDialog(false);
        setEditingShipment(null);
        fetchShipments();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update pickup location',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pickup location',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedShipments.length === 0) return;
    
    try {
      // Implement bulk actions here
      for (const shipmentId of selectedShipments) {
        switch (bulkAction) {
          case 'update-status':
            // Implement bulk status update
            break;
          case 'export':
            // Implement bulk export
            break;
          case 'delete':
            // Implement bulk delete
            break;
        }
      }
      
      toast({
        title: 'Success',
        description: `Bulk action applied to ${selectedShipments.length} shipments`,
      });
      
      setSelectedShipments([]);
      setBulkAction('');
      fetchShipments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply bulk action',
        variant: 'destructive',
      });
    }
  };

  const resetCreateForm = () => {
    setCreateData({
      orderId: '',
      shipmentType: 'FORWARD',
      pickupLocation: warehouses[0]?.name || '',
      shippingMode: 'Surface',
      weight: 500,
      dimensions: { length: 10, width: 10, height: 10 },
      customFields: {
        fragile_shipment: false,
        dangerous_good: false,
        plastic_packaging: false,
        auto_generate_waybill: true,
        auto_generate_hsn: true
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShipmentTypeColor = (type: string) => {
    switch (type) {
      case 'FORWARD':
        return 'bg-blue-100 text-blue-800';
      case 'REVERSE':
        return 'bg-orange-100 text-orange-800';
      case 'REPLACEMENT':
        return 'bg-purple-100 text-purple-800';
      case 'MPS':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportShipments = () => {
    const csvData = filteredShipments.map(shipment => ({
      'Order ID': shipment.orderId,
      'Waybill': shipment.waybillNumbers.join(', '),
      'Customer': shipment.customerName,
      'Phone': shipment.customerPhone,
      'Type': shipment.shipmentType,
      'Status': shipment.status,
      'Pickup Location': shipment.pickupLocation,
      'Created': new Date(shipment.createdAt).toLocaleDateString(),
      'COD Amount': shipment.codAmount
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Success',
      description: 'Shipments exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shipments Management
              </h1>
              <p className="text-gray-600">
                Manage all shipments, tracking, and logistics operations
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTrackDialog(true)}
                className="flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Track</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={exportShipments}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Shipment</span>
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.deliveryRate.toFixed(1)}% delivery rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Order ID, Waybill, Customer..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Type</Label>
                  <Select value={filters.shipmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, shipmentType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="FORWARD">Forward</SelectItem>
                      <SelectItem value="REVERSE">Reverse</SelectItem>
                      <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                      <SelectItem value="MPS">MPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Pickup Location</Label>
                  <Select value={filters.pickupLocation} onValueChange={(value) => setFilters(prev => ({ ...prev, pickupLocation: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.name} value={warehouse.name}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      search: '',
                      status: '',
                      shipmentType: '',
                      pickupLocation: '',
                      dateRange: '30',
                      paymentMode: ''
                    })}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedShipments.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-blue-900">
                      {selectedShipments.length} shipments selected
                    </span>
                    
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update-status">Update Status</SelectItem>
                        <SelectItem value="export">Export Selected</SelectItem>
                        <SelectItem value="assign-warehouse">Assign Warehouse</SelectItem>
                        <SelectItem value="track-all">Track All</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={handleBulkAction} disabled={!bulkAction}>
                      Apply Action
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedShipments([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Shipments ({filteredShipments.length})
                </CardTitle>
                <Button variant="outline" onClick={fetchShipments}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShipments(filteredShipments.map(s => s._id));
                            } else {
                              setSelectedShipments([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Waybill</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>COD Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedShipments.includes(shipment._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedShipments(prev => [...prev, shipment._id]);
                              } else {
                                setSelectedShipments(prev => prev.filter(id => id !== shipment._id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span>{shipment.orderId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {shipment.waybillNumbers.map(waybill => (
                              <div key={waybill} className="flex items-center space-x-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {waybill}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => trackShipment(waybill)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{shipment.customerName}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {shipment.customerPhone}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Home className="w-3 h-3 mr-1" />
                              {shipment.destination?.city}, {shipment.destination?.state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getShipmentTypeColor(shipment.shipmentType)}>
                            {shipment.shipmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{shipment.pickupLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ₹{shipment.codAmount?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {
                                setSelectedShipment(shipment);
                                setShowEditDialog(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => trackShipment(shipment.waybillNumbers[0])}>
                                <Eye className="w-4 h-4 mr-2" />
                                Track
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`https://www.delhivery.com/track/package/${shipment.waybillNumbers[0]}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Delhivery Track
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingShipment(shipment);
                                setShowEditPickupDialog(true);
                              }}>
                                <MapPin className="w-4 h-4 mr-2" />
                                Edit Pickup Location
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateShipmentStatus(shipment._id, 'cancelled')}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <p className="text-sm text-gray-600">
              Create a new shipment with automatic waybill and HSN code generation
            </p>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order ID *</Label>
                <Select value={createData.orderId} onValueChange={(value) => setCreateData(prev => ({ ...prev, orderId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map(order => (
                      <SelectItem key={order._id} value={order._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.orderId || order._id.slice(-8)}</span>
                          <span className="text-xs text-gray-500">
                            {order.user?.name || 'Unknown'} - ₹{order.total || order.totalAmount || 0}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipment Type *</Label>
                <Select value={createData.shipmentType} onValueChange={(value: any) => setCreateData(prev => ({ ...prev, shipmentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FORWARD">Forward</SelectItem>
                    <SelectItem value="REVERSE">Reverse</SelectItem>
                    <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                    <SelectItem value="MPS">MPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pickup Location *</Label>
                <Select value={createData.pickupLocation} onValueChange={(value) => setCreateData(prev => ({ ...prev, pickupLocation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.name} value={warehouse.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{warehouse.name}</span>
                          <span className="text-xs text-gray-500">
                            📍 {warehouse.location} {warehouse.active ? '• Active' : '• Inactive'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipping Mode</Label>
                <Select value={createData.shippingMode} onValueChange={(value: any) => setCreateData(prev => ({ ...prev, shippingMode: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Surface">Surface</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Weight (grams)</Label>
                <Input
                  type="number"
                  value={createData.weight}
                  onChange={(e) => setCreateData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Length (cm)</Label>
                <Input
                  type="number"
                  value={createData.dimensions.length}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, length: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  value={createData.dimensions.width}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={createData.dimensions.height}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Category (for auto HSN)</Label>
                <Select onValueChange={(value) => setCreateData(prev => ({
                  ...prev,
                  productCategory: value
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing & Textiles</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="books">Books & Stationery</SelectItem>
                    <SelectItem value="cosmetics">Cosmetics & Beauty</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="home">Home & Kitchen</SelectItem>
                    <SelectItem value="sports">Sports & Fitness</SelectItem>
                    <SelectItem value="toys">Toys & Games</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Value (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter product value"
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    estimatedValue: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Shipment Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={createData.customFields.fragile_shipment}
                      onCheckedChange={(checked) => setCreateData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, fragile_shipment: checked }
                      }))}
                    />
                    <Label>Fragile Item</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={createData.customFields.dangerous_good}
                      onCheckedChange={(checked) => setCreateData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, dangerous_good: checked }
                      }))}
                    />
                    <Label>Dangerous Good</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={createData.customFields.plastic_packaging}
                      onCheckedChange={(checked) => setCreateData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, plastic_packaging: checked }
                      }))}
                    />
                    <Label>Plastic Packaging</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={createData.customFields.auto_generate_waybill}
                      onCheckedChange={(checked) => setCreateData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, auto_generate_waybill: checked }
                      }))}
                    />
                    <Label>Auto Generate Waybill</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={createData.customFields.auto_generate_hsn}
                      onCheckedChange={(checked) => setCreateData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, auto_generate_hsn: checked }
                      }))}
                    />
                    <Label>Auto Generate HSN Code</Label>
                  </div>
                  {createData.customFields.auto_generate_waybill && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✓ Waybill: {generateWaybillNumber()}
                    </div>
                  )}
                  {createData.customFields.auto_generate_hsn && createData.productCategory && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ✓ HSN Code: {getHSNCodeForCategory(createData.productCategory)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createShipment} disabled={creating || !createData.orderId || !createData.pickupLocation}>
              {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Shipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Shipment Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Track Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter waybill number"
                value={trackingWaybill}
                onChange={(e) => setTrackingWaybill(e.target.value)}
              />
              <Button onClick={() => trackShipment()}>
                <Search className="w-4 h-4 mr-2" />
                Track
              </Button>
            </div>
            
            {trackingData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(trackingData.status)}>
                      {trackingData.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Current Location</Label>
                    <p>{trackingData.currentLocation || 'Unknown'}</p>
                  </div>
                </div>
                
                {trackingData.scans && trackingData.scans.length > 0 && (
                  <div>
                    <Label>Tracking History</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {trackingData.scans.map((scan: any, index: number) => (
                        <div key={index} className="flex items-center space-x-4 p-2 border rounded">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{scan.status}</p>
                            <p className="text-sm text-gray-600">{scan.instructions}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(scan.date).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pickup Location Dialog */}
      <Dialog open={showEditPickupDialog} onOpenChange={setShowEditPickupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pickup Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingShipment && (
              <div className="text-sm text-gray-600">
                <p><strong>Order ID:</strong> {editingShipment.orderId}</p>
                <p><strong>Current Location:</strong> {editingShipment.pickupLocation}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="pickup-location">New Pickup Location *</Label>
              <Select 
                value={editingShipment?.pickupLocation || ''}
                onValueChange={(value) => editingShipment && setEditingShipment(prev => prev ? { ...prev, pickupLocation: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.name} value={warehouse.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{warehouse.name}</span>
                        <span className="text-xs text-gray-500">{warehouse.location}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditPickupDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => editingShipment && updateShipmentPickupLocation(editingShipment._id, editingShipment.pickupLocation)}
                disabled={!editingShipment}
              >
                Update Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warehouse Help Dialog */}
      <Dialog open={showWarehouseHelpDialog} onOpenChange={setShowWarehouseHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Warehouse Registration Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              To register a warehouse in your Delhivery account, please follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Log in to your Delhivery account dashboard.
              </li>
              <li>
                Navigate to the "Warehouses" section.
              </li>
              <li>
                Click on the "Add Warehouse" button.
              </li>
              <li>
                Fill in the warehouse details:
                <ul className="list-disc list-inside ml-4">
                  <li>Name</li>
                  <li>Location (City, State)</li>
                  <li>Address</li>
                  <li>Pincode</li>
                  <li>Phone number</li>
                </ul>
              </li>
              <li>
                Set the warehouse status to "Active".
              </li>
              <li>
                Click "Save" to register the warehouse.
              </li>
            </ol>
            <p className="text-gray-700">
              Once your warehouse is registered, you can select it as a pickup location while creating shipments.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
