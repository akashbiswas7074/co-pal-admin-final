'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Weight, 
  Ruler, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Edit,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  Replace,
  PackageX,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Phone,
  Mail,
  User,
  Home,
  Building,
  Globe,
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  Truck as TruckIcon,
  PackageOpen,
  Scan,
  History,
  Route,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type {
  ShipmentDetails,
  ShipmentData,
  ShipmentCreateRequest,
  WarehouseInfo,
  ShipmentPackage,
  CreateShipmentResponse,
  TrackingInfo
} from '@/types/shipment';

interface ComprehensiveShipmentManagerProps {
  orderId?: string;
  onShipmentCreated?: (shipment: any) => void;
  className?: string;
  mode?: 'single' | 'bulk' | 'dashboard';
}

interface ShipmentListItem {
  _id: string;
  orderId: string;
  waybillNumbers: string[];
  status: string;
  shipmentType: string;
  pickupLocation: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  deliveryDate?: string;
  trackingInfo?: TrackingInfo;
}

interface BulkShipmentData {
  orderIds: string[];
  commonSettings: {
    pickupLocation: string;
    shippingMode: 'Surface' | 'Express';
    shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  };
}

export function ComprehensiveShipmentManager({ 
  orderId, 
  onShipmentCreated, 
  className = '',
  mode = 'single'
}: ComprehensiveShipmentManagerProps) {
  const { toast } = useToast();
  
  // Main state
  const [activeTab, setActiveTab] = useState('overview');
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [shipmentList, setShipmentList] = useState<ShipmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [createData, setCreateData] = useState<ShipmentCreateRequest>({
    orderId: orderId || '',
    shipmentType: 'FORWARD',
    pickupLocation: '',
    shippingMode: 'Surface',
    weight: 500,
    dimensions: {
      length: 10,
      width: 10,
      height: 10
    },
    packages: [],
    customFields: {
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false,
      hsn_code: '',
      ewb: ''
    }
  });

  // Bulk operations state
  const [bulkData, setBulkData] = useState<BulkShipmentData>({
    orderIds: [],
    commonSettings: {
      pickupLocation: '',
      shippingMode: 'Surface',
      shipmentType: 'FORWARD'
    }
  });

  // Tracking state
  const [trackingData, setTrackingData] = useState<{ [key: string]: TrackingInfo }>({});
  const [trackingWaybill, setTrackingWaybill] = useState('');

  // Filter and search state
  const [filters, setFilters] = useState({
    status: '',
    shipmentType: '',
    pickupLocation: '',
    dateRange: '',
    search: ''
  });

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentListItem | null>(null);

  // Load data on mount
  useEffect(() => {
    if (mode === 'single' && orderId) {
      fetchShipmentData();
    } else if (mode === 'dashboard') {
      fetchShipmentList();
    }
  }, [orderId, mode]);

  // Fetch single shipment data
  const fetchShipmentData = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment?orderId=${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setShipmentData(result.data);
        
        // Set default pickup location if available
        if (result.data.warehouses && result.data.warehouses.length > 0) {
          setCreateData(prev => ({
            ...prev,
            pickupLocation: prev.pickupLocation || result.data.warehouses[0].name
          }));
        }
      } else {
        setError(result.error || 'Failed to fetch shipment data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipment list for dashboard
  const fetchShipmentList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/list');
      const result = await response.json();
      
      if (result.success) {
        setShipmentList(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch shipment list');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create single shipment
  const createShipment = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `${createData.shipmentType} shipment created successfully`,
        });
        
        setShowCreateDialog(false);
        onShipmentCreated?.(result.data);
        
        // Refresh data
        if (mode === 'single') {
          fetchShipmentData();
        } else {
          fetchShipmentList();
        }
      } else {
        setError(result.error || 'Failed to create shipment');
        toast({
          title: 'Error',
          description: result.error || 'Failed to create shipment',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Create bulk shipments
  const createBulkShipments = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `${result.data.created} shipments created successfully`,
        });
        
        setShowBulkDialog(false);
        fetchShipmentList();
      } else {
        setError(result.error || 'Failed to create bulk shipments');
        toast({
          title: 'Error',
          description: result.error || 'Failed to create bulk shipments',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Track shipment
  const trackShipment = async (waybill: string) => {
    if (!waybill) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/shipment/track?waybill=${waybill}`);
      const result = await response.json();
      
      if (result.success) {
        setTrackingData(prev => ({
          ...prev,
          [waybill]: result.data
        }));
        
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
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update shipment status
  const updateShipmentStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/shipment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          newStatus,
          updatedBy: 'admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Status updated to ${newStatus}`,
        });
        
        // Refresh data
        if (mode === 'single') {
          fetchShipmentData();
        } else {
          fetchShipmentList();
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    }
  };

  // Edit shipment
  const editShipment = async (shipment: ShipmentListItem, editData: any) => {
    try {
      const response = await fetch('/api/shipment/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: shipment.orderId,
          waybillNumber: shipment.waybillNumbers[0],
          editData
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Shipment updated successfully',
        });
        
        setShowEditDialog(false);
        setEditingShipment(null);
        fetchShipmentList();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update shipment',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    }
  };

  // Get status color
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

  // Get shipment type color
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

  // Filter shipments
  const filteredShipments = shipmentList.filter(shipment => {
    if (filters.status && shipment.status !== filters.status) return false;
    if (filters.shipmentType && shipment.shipmentType !== filters.shipmentType) return false;
    if (filters.pickupLocation && shipment.pickupLocation !== filters.pickupLocation) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        shipment.orderId.toLowerCase().includes(searchTerm) ||
        shipment.waybillNumbers.some(w => w.toLowerCase().includes(searchTerm)) ||
        shipment.customerName.toLowerCase().includes(searchTerm) ||
        shipment.customerPhone.includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading shipment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'single' ? 'Shipment Management' : 'Shipment Dashboard'}
          </h2>
          <p className="text-gray-600">
            {mode === 'single' 
              ? `Managing shipments for order ${orderId}`
              : `Manage all shipments and logistics operations`
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          {mode === 'dashboard' && (
            <>
              <Button 
                onClick={() => setShowBulkDialog(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Create</span>
              </Button>
              
              <Button 
                onClick={() => setShowTrackingDialog(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Track</span>
              </Button>
            </>
          )}
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shipment</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shipmentList.length}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {shipmentList.filter(s => s.status.toLowerCase() === 'delivered').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  95% delivery rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {shipmentList.filter(s => s.status.toLowerCase() === 'dispatched').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average 3-5 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Single Order Overview */}
          {mode === 'single' && shipmentData && (
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Order ID</Label>
                    <p className="font-medium">{shipmentData.orderId}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(shipmentData.status)}>
                      {shipmentData.status}
                    </Badge>
                  </div>
                </div>
                
                {shipmentData.availableActions.length > 0 && (
                  <div>
                    <Label>Available Actions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shipmentData.availableActions.map(action => (
                        <Button
                          key={action}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCreateData(prev => ({ ...prev, shipmentType: action as any }));
                            setShowCreateDialog(true);
                          }}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      {Array.from(new Set(shipmentList.map(s => s.pickupLocation))).map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ status: '', shipmentType: '', pickupLocation: '', dateRange: '', search: '' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Shipments ({filteredShipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Waybill</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment._id}>
                        <TableCell className="font-medium">{shipment.orderId}</TableCell>
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
                            <p className="text-sm text-gray-600">{shipment.customerPhone}</p>
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
                        <TableCell>{shipment.pickupLocation}</TableCell>
                        <TableCell>
                          {new Date(shipment.createdAt).toLocaleDateString()}
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
                                setEditingShipment(shipment);
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
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Track Shipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter waybill number"
                  value={trackingWaybill}
                  onChange={(e) => setTrackingWaybill(e.target.value)}
                />
                <Button onClick={() => trackShipment(trackingWaybill)}>
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {Object.entries(trackingData).map(([waybill, data]) => (
            <Card key={waybill}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Waybill: {waybill}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(data.status)}>
                        {data.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Current Location</Label>
                      <p>{data.currentLocation || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tracking History</Label>
                    <div className="mt-2 space-y-2">
                      {data.scans.map((scan, index) => (
                        <div key={index} className="flex items-center space-x-4 p-2 border rounded">
                          <div className="flex-shrink-0">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    shipmentList.reduce((acc, shipment) => {
                      acc[shipment.shipmentType] = (acc[shipment.shipmentType] || 0) + 1;
                      return acc;
                    }, {} as { [key: string]: number })
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span>{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    shipmentList.reduce((acc, shipment) => {
                      acc[shipment.status] = (acc[shipment.status] || 0) + 1;
                      return acc;
                    }, {} as { [key: string]: number })
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span>{status}</span>
                      <Badge className={getStatusColor(status)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order ID</Label>
                <Input
                  value={createData.orderId}
                  onChange={(e) => setCreateData(prev => ({ ...prev, orderId: e.target.value }))}
                  placeholder="Enter order ID"
                />
              </div>
              <div>
                <Label>Shipment Type</Label>
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
                <Label>Pickup Location</Label>
                <Select value={createData.pickupLocation} onValueChange={(value) => setCreateData(prev => ({ ...prev, pickupLocation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipmentData?.warehouses.map(warehouse => (
                      <SelectItem key={warehouse.name} value={warehouse.name}>
                        {warehouse.name} - {warehouse.location}
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
                  value={createData.dimensions?.length}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions!, length: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  value={createData.dimensions?.width}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions!, width: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={createData.dimensions?.height}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions!, height: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Handling</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={createData.customFields?.fragile_shipment}
                    onCheckedChange={(checked) => setCreateData(prev => ({
                      ...prev,
                      customFields: { ...prev.customFields!, fragile_shipment: checked }
                    }))}
                  />
                  <Label>Fragile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={createData.customFields?.dangerous_good}
                    onCheckedChange={(checked) => setCreateData(prev => ({
                      ...prev,
                      customFields: { ...prev.customFields!, dangerous_good: checked }
                    }))}
                  />
                  <Label>Dangerous Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={createData.customFields?.plastic_packaging}
                    onCheckedChange={(checked) => setCreateData(prev => ({
                      ...prev,
                      customFields: { ...prev.customFields!, plastic_packaging: checked }
                    }))}
                  />
                  <Label>Plastic Packaging</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createShipment} disabled={creating}>
                {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Create Shipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional dialogs would go here... */}
    </div>
  );
}
