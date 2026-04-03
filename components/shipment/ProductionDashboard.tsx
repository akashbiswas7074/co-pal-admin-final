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

interface ProductionDashboardProps {
  selectedOrderId?: string;
}

interface ShipmentData {
  _id: string;
  orderId: string;
  waybillNumbers: string[];
  primaryWaybill: string;
  shipmentType: string;
  status: string;
  pickupLocation: string;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
  };
  packageDetails: {
    weight: number;
    paymentMode: string;
    codAmount?: number;
  };
  trackingInfo?: {
    lastUpdated: string;
    currentStatus: string;
    events: Array<{
      date: string;
      status: string;
      location: string;
      description: string;
    }>;
  };
  labelGenerated: boolean;
  labelUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface EWaybillData {
  _id?: string;
  waybillNumber: string;
  ewaybillNumber: string;
  status: string;
  validUntil: string;
  invoiceNumber: string;
  invoiceValue: number;
  updatedAt?: string;
}

interface PickupData {
  _id?: string;
  pickupId: string;
  waybillNumbers: string[];
  scheduledDate: string;
  status: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  createdAt?: string;
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

export default function ProductionDashboard({ selectedOrderId }: ProductionDashboardProps) {
  const [activeTab, setActiveTab] = useState('ewaybill');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shipments data
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [waybillNumbers, setWaybillNumbers] = useState<string[]>([]);
  
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
  
  // Document types for Delhivery API
  const documentTypes = [
    { value: 'LABEL', label: 'Shipping Label' },
    { value: 'SIGNATURE_URL', label: 'Delivery Signature' },
    { value: 'RVP_QC_IMAGE', label: 'Quality Check Image' },
    { value: 'EPOD', label: 'Electronic POD' },
    { value: 'SELLER_RETURN_IMAGE', label: 'Return Image' }
  ];
  
  // Serviceability
  const [serviceabilityPincode, setServiceabilityPincode] = useState('');
  const [serviceabilityResult, setServiceabilityResult] = useState<any>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load initial data
  useEffect(() => {
    fetchWaybillNumbers();
    fetchShipments();
    fetchEwaybills();
    fetchPickups();
    fetchTrackingHistory();
    fetchDashboardAnalytics();
  }, []);

  // Fetch waybill numbers from MongoDB
  const fetchWaybillNumbers = async () => {
    try {
      const response = await fetch('/api/shipment/waybills/list');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setWaybillNumbers(result.data.waybillNumbers || []);
        console.log('Fetched waybill numbers:', result.data.waybillNumbers?.length);
      } else {
        console.error('Failed to fetch waybill numbers:', result.error);
      }
    } catch (err: any) {
      console.error('Error fetching waybill numbers:', err);
      // Don't show error toast for this as it's a background operation
    }
  };

  // Fetch all shipments from MongoDB
  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipment/list?useNew=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShipments(result.data.shipments || []);
      } else {
        throw new Error(result.error || 'Failed to fetch shipments');
      }
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch shipments from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch e-waybill records from MongoDB
  const fetchEwaybills = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/ewaybill');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setEwaybills(result.data || []);
        toast({
          title: "Success",
          description: `Loaded ${result.data?.length || 0} e-waybill records`,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch e-waybills');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching e-waybills:', err);
      toast({
        title: "Error",
        description: "Failed to fetch e-waybills from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tracking history from MongoDB
  const fetchTrackingHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/tracking/history');
      const result = await response.json();
      
      if (result.success) {
        setTrackingData(result.data || []);
        toast({
          title: "Success",
          description: `Loaded ${result.data?.length || 0} tracking records`,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch tracking history');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tracking history:', err);
      toast({
        title: "Error",
        description: "Failed to fetch tracking history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard analytics from MongoDB
  const fetchDashboardAnalytics = async () => {
    try {
      const response = await fetch('/api/shipment/analytics');
      const result = await response.json();
      
      if (result.success) {
        const analytics = result.data;
        // You can use this data to update dashboard statistics
        console.log('Dashboard Analytics:', analytics);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard analytics:', err);
    }
  };

  // Fetch pickups
  const fetchPickups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/pickup?limit=50');
      const result = await response.json();
      
      if (result.success) {
        setPickups(result.data || []);
        toast({
          title: "Success",
          description: "Pickups refreshed successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to fetch pickups');
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
        // Refresh e-waybill list
        await fetchEwaybills();
        
        // Clear form
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

  // Request Pickup - Delhivery API Integration
  const handleRequestPickup = async () => {
    const waybillList = pickupWaybills.split(',').map(w => w.trim()).filter(w => w);
    
    if (waybillList.length === 0 || !pickupDate || !pickupTime || !pickupAddress.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (waybills, date, time, pickup location)",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Delhivery Pickup Request Creation API
      const response = await fetch('/api/shipment/pickup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_time: pickupTime + ':00', // Convert to hh:mm:ss format
          pickup_date: pickupDate, // YYYY-MM-DD format
          pickup_location: pickupAddress.trim(), // Registered warehouse name
          expected_package_count: waybillList.length,
          waybillNumbers: waybillList,
          contactPerson: pickupContact.trim(),
          contactNumber: pickupPhone.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh pickup list
        await fetchPickups();
        
        // Clear form
        setPickupWaybills('');
        setPickupDate('');
        setPickupTime('');
        setPickupAddress('');
        setPickupContact('');
        setPickupPhone('');
        
        toast({
          title: "Success",
          description: `Pickup request created successfully! Pickup ID: ${result.data.pickup_id || 'Generated'}`,
        });
      } else {
        throw new Error(result.error || 'Failed to create pickup request');
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

  // Track Shipment - Delhivery API Integration
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
      // Delhivery Shipment Tracking API
      const response = await fetch(`/api/shipment/tracking/delhivery?waybill=${trackingWaybill.trim()}`);
      const result = await response.json();
      
      if (result.success) {
        const trackingInfo = result.data;
        
        const newTracking: TrackingData = {
          waybillNumber: trackingWaybill.trim(),
          status: trackingInfo.status || 'Unknown',
          currentLocation: trackingInfo.current_location || 'Not available',
          estimatedDelivery: trackingInfo.estimated_delivery || 'TBD',
          scans: trackingInfo.scans || [],
          isAvailable: true,
          message: ''
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
        
        setTrackingWaybill('');
        
        toast({
          title: "Success",
          description: "Shipment tracking retrieved from Delhivery successfully",
        });
      } else {
        // Handle case where tracking is not available
        const newTracking: TrackingData = {
          waybillNumber: trackingWaybill.trim(),
          status: 'Not Found',
          currentLocation: 'N/A',
          estimatedDelivery: 'N/A',
          scans: [],
          isAvailable: false,
          message: result.error || 'Tracking information not available for this waybill'
        };
        
        setTrackingData(prev => [newTracking, ...prev]);
        setTrackingWaybill('');
        
        toast({
          title: "Warning",
          description: "Tracking information not found for this waybill",
          variant: "destructive"
        });
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

  // Download Label - Enhanced with Delhivery Document API
  const handleDownloadLabel = async (waybillNumber: string) => {
    try {
      const response = await fetch(`/api/shipment/documents/download?waybill=${waybillNumber}&doc_type=LABEL`);
      const result = await response.json();
      
      if (result.success && result.data.documentUrl) {
        window.open(result.data.documentUrl, '_blank');
        toast({
          title: "Success",
          description: "Label downloaded successfully",
        });
      } else {
        throw new Error(result.error || 'Label not available');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to download label",
        variant: "destructive"
      });
    }
  };

  // Download Document - Delhivery Document API Integration
  const handleDownloadDocument = async (waybillNumber: string, docType: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shipment/documents/download?waybill=${waybillNumber}&doc_type=${docType}`);
      const result = await response.json();
      
      if (result.success && result.data.documentUrl) {
        window.open(result.data.documentUrl, '_blank');
        toast({
          title: "Success",
          description: `${docType} document downloaded successfully`,
        });
      } else {
        throw new Error(result.error || `${docType} document not available`);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to download ${docType} document`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  // Delete E-waybill Record
  const handleDeleteEwaybill = async (ewaybillId: string) => {
    if (!confirm('Are you sure you want to delete this e-waybill record? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment/ewaybill?id=${ewaybillId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the deleted e-waybill from the list
        setEwaybills(prev => prev.filter(e => e._id !== ewaybillId));
        
        toast({
          title: "Success",
          description: "E-waybill record deleted successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to delete e-waybill record');
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

  // Cancel Pickup
  const handleCancelPickup = async (pickupId: string) => {
    if (!confirm('Are you sure you want to cancel this pickup? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment/pickup?id=${pickupId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the cancelled pickup from the list
        setPickups(prev => prev.filter(p => p._id !== pickupId));
        
        toast({
          title: "Success",
          description: "Pickup cancelled successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to cancel pickup');
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

  // Filter data based on search and status
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      (shipment.primaryWaybill || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.customerDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.orderId ? String(shipment.orderId) : '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (shipment.status || '').toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

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

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Barcode className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Available Waybills</p>
                <p className="font-medium">{waybillNumbers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search waybills, orders, or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="manifested">Manifested</SelectItem>
                <SelectItem value="in transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchShipments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Select a waybill number to update its e-waybill information
                </p>
                <Button
                  onClick={fetchWaybillNumbers}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Waybills
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ewaybillWaybill">Waybill Number</Label>
                  <Select value={ewaybillWaybill} onValueChange={setEwaybillWaybill}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        waybillNumbers.length === 0 
                          ? "No waybills available" 
                          : `Select from ${waybillNumbers.length} waybills`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {waybillNumbers.length === 0 ? (
                        <SelectItem value="no-waybills" disabled>
                          No waybill numbers found
                        </SelectItem>
                      ) : (
                        waybillNumbers.map(waybill => (
                          <SelectItem key={waybill} value={waybill}>
                            {waybill}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
          {/* E-waybill Records */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800">E-waybill Records</CardTitle>
                    <p className="text-sm text-green-600 mt-1">
                      {ewaybills.length} e-waybill{ewaybills.length !== 1 ? 's' : ''} updated
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchEwaybills}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ewaybills.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No E-waybills Updated</h3>
                  <p className="text-gray-500 mb-4">Update your first e-waybill to get started</p>
                  <Button
                    onClick={() => {
                      document.getElementById('ewaybillWaybill')?.focus();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Update E-waybill
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b">
                        <TableHead className="font-semibold text-gray-700">Waybill Details</TableHead>
                        <TableHead className="font-semibold text-gray-700">E-waybill Info</TableHead>
                        <TableHead className="font-semibold text-gray-700">Invoice Details</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status & Validity</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ewaybills.map((ewaybill, index) => {
                        const isActive = ewaybill.status === 'Active';
                        const isExpired = ewaybill.validUntil && new Date(ewaybill.validUntil) < new Date();
                        
                        return (
                          <TableRow 
                            key={ewaybill._id || index}
                            className={`hover:bg-gray-50 transition-colors ${
                              isExpired ? 'bg-red-50' : isActive ? 'bg-green-50' : ''
                            }`}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isExpired ? 'bg-red-500' : isActive ? 'bg-green-500' : 'bg-gray-500'
                                  }`} />
                                  <span className="font-mono text-sm font-medium">{ewaybill.waybillNumber}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyToClipboard(ewaybill.waybillNumber)}
                                    className="h-6 w-6 p-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Updated {new Date(ewaybill.updatedAt || Date.now()).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="font-mono text-sm font-medium">{ewaybill.ewaybillNumber}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyToClipboard(ewaybill.ewaybillNumber)}
                                    className="h-6 w-6 p-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500">E-waybill Number</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{ewaybill.invoiceNumber}</span>
                                </div>
                                <p className="text-sm font-semibold text-green-600">
                                  ₹{ewaybill.invoiceValue.toLocaleString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Badge 
                                  variant={
                                    isExpired ? 'destructive' :
                                    isActive ? 'default' : 'secondary'
                                  }
                                  className={
                                    isExpired ? 'bg-red-100 text-red-800 border-red-200' :
                                    isActive ? 'bg-green-100 text-green-800 border-green-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  }
                                >
                                  {isExpired ? 'Expired' : ewaybill.status}
                                </Badge>
                                {ewaybill.validUntil && (
                                  <p className="text-xs text-gray-500">
                                    Valid until {new Date(ewaybill.validUntil).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadLabel(ewaybill.waybillNumber)}
                                  title="Download Label"
                                  className="h-8 w-8 p-1"
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTrackingWaybill(ewaybill.waybillNumber);
                                    setActiveTab('tracking');
                                  }}
                                  title="Track Shipment"
                                  className="h-8 w-8 p-1"
                                >
                                  <MapPin className="h-4 w-4 text-green-600" />
                                </Button>
                                {ewaybill._id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEwaybill(ewaybill._id!)}
                                    title="Delete E-waybill"
                                    className="h-8 w-8 p-1"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pickup Management Tab */}
        <TabsContent value="pickup" className="space-y-6">
          {/* Pickup Form */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <PhoneCall className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Schedule Pickup Request</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Schedule pickup for one or more waybill numbers
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchWaybillNumbers}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="bg-white hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Waybills
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Waybill Selection Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Barcode className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="pickupWaybills" className="text-base font-medium">
                      Select Waybill Numbers
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Textarea
                        id="pickupWaybills"
                        placeholder="Selected waybill numbers will appear here..."
                        value={pickupWaybills}
                        onChange={(e) => setPickupWaybills(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      {pickupWaybills && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800">
                            Selected: {pickupWaybills.split(',').filter(w => w.trim()).length} waybill(s)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">
                            Available Waybills ({waybillNumbers.length})
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const allWaybills = waybillNumbers.slice(0, 10).join(', ');
                              setPickupWaybills(allWaybills);
                            }}
                            disabled={waybillNumbers.length === 0}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Select All (10)
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {waybillNumbers.length === 0 ? (
                              <div className="text-center p-4 text-gray-500">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No waybill numbers available</p>
                              </div>
                            ) : (
                              waybillNumbers.slice(0, 20).map(waybill => (
                                <Badge 
                                  key={waybill} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                  onClick={() => {
                                    const current = pickupWaybills.split(',').map(w => w.trim()).filter(w => w);
                                    if (!current.includes(waybill)) {
                                      setPickupWaybills([...current, waybill].join(', '));
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {waybill}
                                </Badge>
                              ))
                            )}
                            {waybillNumbers.length > 20 && (
                              <Badge variant="secondary" className="cursor-default">
                                +{waybillNumbers.length - 20} more available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pickup Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Schedule & Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <h3 className="text-base font-medium">Schedule Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickupDate" className="text-sm font-medium">
                          Pickup Date *
                        </Label>
                        <Input
                          id="pickupDate"
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupTime" className="text-sm font-medium">
                          Pickup Time *
                        </Label>
                        <Input
                          id="pickupTime"
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickupContact" className="text-sm font-medium">
                          Contact Person *
                        </Label>
                        <Input
                          id="pickupContact"
                          placeholder="e.g., John Doe"
                          value={pickupContact}
                          onChange={(e) => setPickupContact(e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupPhone" className="text-sm font-medium">
                          Contact Number *
                        </Label>
                        <Input
                          id="pickupPhone"
                          placeholder="e.g., +91 9876543210"
                          value={pickupPhone}
                          onChange={(e) => setPickupPhone(e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h3 className="text-base font-medium">Pickup Address</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pickupAddress" className="text-sm font-medium">
                        Pickup Location (Warehouse Name) *
                      </Label>
                      <Input
                        id="pickupAddress"
                        placeholder="Enter registered warehouse name (e.g., warehouse_mumbai)"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Enter the registered warehouse name as per Delhivery records. This should match your pickup location configuration.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleRequestPickup}
                    disabled={loading || !pickupWaybills.trim() || !pickupDate || !pickupTime || !pickupContact.trim() || !pickupPhone.trim() || !pickupAddress.trim()}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Scheduling Pickup...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="h-5 w-5 mr-2" />
                        Schedule Pickup Request
                      </>
                    )}
                  </Button>
                  {(!pickupWaybills.trim() || !pickupDate || !pickupTime || !pickupContact.trim() || !pickupPhone.trim() || !pickupAddress.trim()) && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Please fill all required fields to schedule pickup
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickup List */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <PhoneCall className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-800">Scheduled Pickups</CardTitle>
                    <p className="text-sm text-orange-600 mt-1">
                      {pickups.length} pickup{pickups.length !== 1 ? 's' : ''} scheduled
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchPickups}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pickups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <PhoneCall className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pickups Scheduled</h3>
                  <p className="text-gray-500 mb-4">Schedule your first pickup to get started</p>
                  <Button
                    onClick={() => {
                      // Focus on the first input in the pickup form
                      document.getElementById('pickupWaybills')?.focus();
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Pickup
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b">
                        <TableHead className="font-semibold text-gray-700">Pickup Details</TableHead>
                        <TableHead className="font-semibold text-gray-700">Waybills</TableHead>
                        <TableHead className="font-semibold text-gray-700">Schedule</TableHead>
                        <TableHead className="font-semibold text-gray-700">Contact Info</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pickups.map((pickup, index) => {
                        const isCompleted = pickup.status === 'Completed';
                        const isPending = pickup.status === 'Scheduled' || pickup.status === 'Pending';
                        const isInProgress = pickup.status === 'In Progress' || pickup.status === 'Picked Up';
                        const isCancelled = pickup.status === 'Cancelled';
                        return (
                          <TableRow 
                            key={pickup._id || index}
                            className={`hover:bg-gray-50 transition-colors ${
                              isCompleted ? 'bg-green-50' : 
                              isInProgress ? 'bg-blue-50' : 
                              isCancelled ? 'bg-red-50' : ''
                            }`}
                          >
                            {/* Pickup Details */}
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isCompleted ? 'bg-green-500' : 
                                    isInProgress ? 'bg-blue-500' : 
                                    isCancelled ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} />
                                  <span className="font-mono text-xs text-gray-700">{pickup.pickupId || 'N/A'}</span>
                                </div>
                                <p className="text-xs text-gray-500">{pickup.status}</p>
                              </div>
                            </TableCell>
                            {/* Waybills */}
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {pickup.waybillNumbers && pickup.waybillNumbers.length > 0 ? (
                                  pickup.waybillNumbers.map((waybill, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {waybill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">No waybills</span>
                                )}
                              </div>
                            </TableCell>
                            {/* Schedule */}
                            <TableCell>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-700">{pickup.scheduledDate || 'N/A'}</span>
                              </div>
                            </TableCell>
                            {/* Contact Info */}
                            <TableCell>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-700">{pickup.contactPerson || 'N/A'}</span>
                                <span className="text-xs text-gray-500">{pickup.contactNumber || ''}</span>
                              </div>
                            </TableCell>
                            {/* Status */}
                            <TableCell>
                              <Badge 
                                variant={
                                  isCompleted ? 'default' :
                                  isInProgress ? 'secondary' :
                                  isCancelled ? 'destructive' : 'outline'
                                }
                                className={
                                  isCompleted ? 'bg-green-100 text-green-800 border-green-200' :
                                  isInProgress ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  isCancelled ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }
                              >
                                {pickup.status}
                              </Badge>
                            </TableCell>
                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {pickup.status !== 'Cancelled' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelPickup(pickup._id)}
                                    title="Cancel Pickup"
                                    className="h-8 w-8 p-1"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
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
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Track the status and location of shipments
                </p>
                <Button
                  onClick={fetchWaybillNumbers}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Waybills
                </Button>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="trackingWaybill">Waybill Number</Label>
                  <Select value={trackingWaybill} onValueChange={setTrackingWaybill}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        waybillNumbers.length === 0 
                          ? "No waybills available" 
                          : `Select from ${waybillNumbers.length} waybills to track`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {waybillNumbers.length === 0 ? (
                        <SelectItem value="no-waybills" disabled>
                          No waybill numbers found
                        </SelectItem>
                      ) : (
                        waybillNumbers.map(waybill => (
                          <SelectItem key={waybill} value={waybill}>
                            {waybill}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
            <Card key={index} className="border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-800">Tracking: {tracking.waybillNumber}</CardTitle>
                      <Badge 
                        variant="default" 
                        className="mt-1 bg-purple-100 text-purple-800 border-purple-200"
                      >
                        {tracking.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {/* Document Download Options */}
                    <div className="flex space-x-1">
                      {documentTypes.map((docType) => (
                        <Button
                          key={docType.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(tracking.waybillNumber, docType.value)}
                          title={`Download ${docType.label}`}
                          className="h-8 px-2 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {docType.value}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-600">Current Location</p>
                    </div>
                    <p className="font-medium text-lg">{tracking.currentLocation}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-600">Estimated Delivery</p>
                    </div>
                    <p className="font-medium text-lg">{tracking.estimatedDelivery}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-600">Status</p>
                    </div>
                    <Badge className="text-sm px-3 py-1">{tracking.status}</Badge>
                  </div>
                </div>
                
                {tracking.scans && tracking.scans.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-lg">Tracking History</h4>
                    </div>
                    <div className="space-y-3">
                      {tracking.scans.map((scan, scanIndex) => (
                        <div key={scanIndex} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{scan.status}</p>
                              <p className="text-sm text-gray-500">{scan.date}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{scan.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{scan.location}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 mt-6 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setTrackingWaybill(tracking.waybillNumber);
                      handleTrackShipment();
                    }}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Tracking
                  </Button>
                  <Button
                    onClick={() => handleCopyToClipboard(tracking.waybillNumber)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Waybill
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Shipments Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Available Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waybill</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.slice(0, 10).map((shipment) => (
                    <TableRow key={shipment._id}>
                      <TableCell className="font-mono">{shipment.primaryWaybill || 'N/A'}</TableCell>
                      <TableCell className="font-mono">{shipment.orderId ? String(shipment.orderId).slice(-8) : 'N/A'}</TableCell>
                      <TableCell>{shipment.customerDetails?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{shipment.status || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (shipment.primaryWaybill) {
                              setTrackingWaybill(shipment.primaryWaybill);
                              handleTrackShipment();
                            }
                          }}
                          disabled={!shipment.primaryWaybill}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
