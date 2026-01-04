'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  FileText,
  Barcode,
  PhoneCall,
  Globe,
  Zap,
  RefreshCw,
  Copy,
  ShoppingCart,
  Users,
  Filter,
  MoreHorizontal,
  Trash2
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
// import OrderManagement from './OrderManagement';

interface ProductionDashboardProps {
  selectedOrderId?: string;
}

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
    phone?: string;
  };
  orderItems: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  paymentMethod: string;
  paymentStatus: string;
  user?: {
    name: string;
    email: string;
  };
}

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

interface WaybillData {
  waybillNumber: string;
  status: string;
  orderId?: string;
  generatedAt: string;
  labelUrl?: string;
  pickupScheduled?: boolean;
}

interface TrackingData {
  waybillNumber: string;
  status: string;
  currentLocation: string;
  estimatedDelivery: string;
  scans: Array<{
    date: string;
    location: string;
    status: string;
    description: string;
  }>;
  isAvailable?: boolean;
  message?: string;
}

interface PickupData {
  pickupId: string;
  waybillNumbers: string[];
  scheduledDate: string;
  status: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
}

interface EWaybillData {
  waybillNumber: string;
  ewaybillNumber: string;
  status: string;
  validUntil: string;
  invoiceNumber: string;
  invoiceValue: number;
}

export default function ProductionDashboard({ selectedOrderId }: ProductionDashboardProps) {
  const [activeTab, setActiveTab] = useState('ewaybill');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Waybill Management (for other features)
  const [waybillCount, setWaybillCount] = useState(5);
  const [waybills, setWaybills] = useState<WaybillData[]>([]);
  
  // Order Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [singleOrderId, setSingleOrderId] = useState<string>('');
  
  // E-waybill Management
  const [ewaybills, setEwaybills] = useState<EWaybillData[]>([]);
  const [ewaybillWaybill, setEwaybillWaybill] = useState('');
  const [ewaybillNumber, setEwaybillNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState(0);
  
  // Pickup Management
  const [pickups, setPickups] = useState<PickupData[]>([]);
  const [pickupWaybills, setPickupWaybills] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupContact, setPickupContact] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  
  // Tracking
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [trackingWaybill, setTrackingWaybill] = useState('');
  
  // Serviceability
  const [serviceabilityPincode, setServiceabilityPincode] = useState('');
  const [serviceabilityResult, setServiceabilityResult] = useState<any>(null);

  // ...existing code...

  // Update E-waybill
  const handleUpdateEwaybill = async () => {
    if (!ewaybillWaybill.trim() || !ewaybillNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter both waybill and e-waybill numbers",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/ewaybill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waybillNumber: ewaybillWaybill.trim(),
          ewaybillNumber: ewaybillNumber.trim(),
          invoiceNumber: invoiceNumber.trim(),
          invoiceValue: invoiceValue
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newEwaybill: EWaybillData = {
          waybillNumber: ewaybillWaybill.trim(),
          ewaybillNumber: ewaybillNumber.trim(),
          status: 'Updated',
          validUntil: result.data.validUntil || '',
          invoiceNumber: invoiceNumber.trim(),
          invoiceValue: invoiceValue
        };
        
        setEwaybills(prev => [newEwaybill, ...prev]);
        setEwaybillWaybill('');
        setEwaybillNumber('');
        setInvoiceNumber('');
        setInvoiceValue(0);
        
        toast({
          title: "Success",
          description: "E-waybill updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update e-waybill');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Request Pickup
  const handleRequestPickup = async () => {
    const waybillNumbers = pickupWaybills.split(',').map(w => w.trim()).filter(w => w);
    
    if (waybillNumbers.length === 0 || !pickupDate || !pickupTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waybillNumbers,
          pickupDate,
          pickupTime,
          pickupAddress: pickupAddress.trim(),
          contactPerson: pickupContact.trim(),
          contactNumber: pickupPhone.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newPickup: PickupData = {
          pickupId: result.data.pickupId,
          waybillNumbers,
          scheduledDate: `${pickupDate} ${pickupTime}`,
          status: 'Scheduled',
          address: pickupAddress.trim(),
          contactPerson: pickupContact.trim(),
          contactNumber: pickupPhone.trim()
        };
        
        setPickups(prev => [newPickup, ...prev]);
        setPickupWaybills('');
        setPickupDate('');
        setPickupTime('');
        setPickupAddress('');
        setPickupContact('');
        setPickupPhone('');
        
        toast({
          title: "Success",
          description: `Pickup ${result.data.pickupId} scheduled successfully`,
        });
      } else {
        throw new Error(result.error || 'Failed to schedule pickup');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err: any) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Handle Order Selection
  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    setCurrentOrder(order || null);
  };

  // Handle Multiple Order Selection
  const handleMultipleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle Bulk Shipment Creation
  const handleBulkShipmentCreation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shipment/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: `Created ${selectedOrders.length} shipments`,
        });
        setSelectedOrders([]);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to create bulk shipments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get Order Status Color
  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'dispatched': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Track Shipment
  const handleTrackShipment = async () => {
    if (!trackingWaybill.trim()) {
      toast({
        title: "Error",
        description: "Please enter a waybill number",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment/tracking?waybill=${trackingWaybill.trim()}`);
      const result = await response.json();
      
      if (result.success) {
        const newTracking: TrackingData = {
          waybillNumber: trackingWaybill.trim(),
          status: result.data.status,
          currentLocation: result.data.currentLocation,
          estimatedDelivery: result.data.estimatedDelivery,
          scans: result.data.scans || []
        };
        
        setTrackingData(prev => {
          const existing = prev.findIndex(t => t.waybillNumber === trackingWaybill.trim());
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newTracking;
            return updated;
          }
          return [newTracking, ...prev];
        });
        
        toast({
          title: "Success",
          description: "Shipment tracking updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to track shipment');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check Serviceability
  const handleCheckServiceability = async () => {
    if (!serviceabilityPincode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a pincode",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment/serviceability?pincode=${serviceabilityPincode.trim()}`);
      const result = await response.json();
      
      if (result.success) {
        setServiceabilityResult(result.data);
        
        toast({
          title: "Success",
          description: "Serviceability check completed",
        });
      } else {
        throw new Error(result.error || 'Failed to check serviceability');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Download Label
  const handleDownloadLabel = async (waybillNumber: string) => {
    try {
      const response = await fetch(`/api/shipment/waybills?waybill=${waybillNumber}&action=label`);
      const result = await response.json();
      
      if (result.success && result.data.labelUrl) {
        window.open(result.data.labelUrl, '_blank');
      } else {
        throw new Error('Label not available');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to download label",
        variant: "destructive"
      });
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🚀 Production Shipment Dashboard</h1>
        <p className="text-gray-600">Complete Delhivery integration with all production features</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">E-waybills</p>
                <p className="font-medium">{ewaybills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PhoneCall className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pickups</p>
                <p className="font-medium">{pickups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tracking</p>
                <p className="font-medium">{trackingData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Serviceable</p>
                <p className="font-medium">{serviceabilityResult ? 'Yes' : 'Check'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ewaybill">E-waybill</TabsTrigger>
          <TabsTrigger value="pickup">Pickup</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="serviceability">Serviceability</TabsTrigger>
        </TabsList>

        {/* E-waybill Management Tab */}
        <TabsContent value="ewaybill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-waybill Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ewaybillWaybill">Waybill Number</Label>
                  <Input
                    id="ewaybillWaybill"
                    placeholder="Enter waybill number"
                    value={ewaybillWaybill}
                    onChange={(e) => setEwaybillWaybill(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ewaybillNumber">E-waybill Number</Label>
                  <Input
                    id="ewaybillNumber"
                    placeholder="Enter e-waybill number"
                    value={ewaybillNumber}
                    onChange={(e) => setEwaybillNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Enter invoice number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceValue">Invoice Value</Label>
                  <Input
                    id="invoiceValue"
                    type="number"
                    placeholder="Enter invoice value"
                    value={invoiceValue}
                    onChange={(e) => setInvoiceValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdateEwaybill}
                disabled={loading}
                className="w-full"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Update E-waybill
              </Button>
            </CardContent>
          </Card>
          {/* E-waybill List */}
          <Card>
            <CardHeader>
              <CardTitle>E-waybill Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waybill Number</TableHead>
                    <TableHead>E-waybill Number</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ewaybills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No e-waybills updated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    ewaybills.map((ewaybill, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{ewaybill.waybillNumber}</TableCell>
                        <TableCell className="font-mono">{ewaybill.ewaybillNumber}</TableCell>
                        <TableCell>{ewaybill.invoiceNumber}</TableCell>
                        <TableCell>₹{ewaybill.invoiceValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="default">{ewaybill.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pickup Management Tab */}
        <TabsContent value="pickup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Pickup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupWaybills">Waybill Numbers (comma-separated)</Label>
                  <Textarea
                    id="pickupWaybills"
                    placeholder="waybill1, waybill2, waybill3"
                    value={pickupWaybills}
                    onChange={(e) => setPickupWaybills(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Pickup Address</Label>
                  <Textarea
                    id="pickupAddress"
                    placeholder="Enter pickup address"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupDate">Pickup Date</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupTime">Pickup Time</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupContact">Contact Person</Label>
                  <Input
                    id="pickupContact"
                    placeholder="Enter contact person name"
                    value={pickupContact}
                    onChange={(e) => setPickupContact(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupPhone">Contact Number</Label>
                  <Input
                    id="pickupPhone"
                    placeholder="Enter contact number"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleRequestPickup}
                disabled={loading}
                className="w-full"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Schedule Pickup
              </Button>
            </CardContent>
          </Card>
          {/* Pickup List */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pickup ID</TableHead>
                    <TableHead>Waybills</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No pickups scheduled yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    pickups.map((pickup, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{pickup.pickupId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {pickup.waybillNumbers.map((waybill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {waybill}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{pickup.scheduledDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pickup.contactPerson}</p>
                            <p className="text-sm text-gray-500">{pickup.contactNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{pickup.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Track Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="trackingWaybill">Waybill Number</Label>
                  <Input
                    id="trackingWaybill"
                    placeholder="Enter waybill number"
                    value={trackingWaybill}
                    onChange={(e) => setTrackingWaybill(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleTrackShipment}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Track
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Tracking Results */}
          {trackingData.map((tracking, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tracking: {tracking.waybillNumber}</span>
                  <Badge variant="default">{tracking.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tracking.message && tracking.isAvailable === false && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No Tracking Data Available</p>
                        <p className="text-sm text-yellow-700 mt-1">{tracking.message}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="font-medium">{tracking.currentLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium">{tracking.estimatedDelivery}</p>
                  </div>
                </div>
                {tracking.scans.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Tracking History</h4>
                    <div className="space-y-2">
                      {tracking.scans.map((scan, scanIndex) => (
                        <div key={scanIndex} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{scan.status}</p>
                            <p className="text-sm text-gray-600">{scan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{scan.location}</p>
                            <p className="text-xs text-gray-500">{scan.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Serviceability Tab */}
        <TabsContent value="serviceability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pincode Serviceability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="serviceabilityPincode">Pincode</Label>
                  <Input
                    id="serviceabilityPincode"
                    placeholder="Enter pincode"
                    value={serviceabilityPincode}
                    onChange={(e) => setServiceabilityPincode(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCheckServiceability}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Check
                  </Button>
                </div>
              </div>
              {serviceabilityResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Serviceability Result</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Pincode</p>
                      <p className="font-medium">{serviceabilityResult.pincode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Serviceable</p>
                      <Badge variant={serviceabilityResult.serviceable ? 'default' : 'destructive'}>
                        {serviceabilityResult.serviceable ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium">{serviceabilityResult.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-medium">{serviceabilityResult.state}</p>
                    </div>
                    {serviceabilityResult.estimatedDays && (
                      <div>
                        <p className="text-sm text-gray-600">Estimated Delivery</p>
                        <p className="font-medium">{serviceabilityResult.estimatedDays} days</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
