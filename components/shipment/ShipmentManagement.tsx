'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Edit, 
  X, 
  FileText, 
  Download,
  Truck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  PhoneCall,
  MapPin,
  Calendar
} from 'lucide-react';
import { ShippingLabelGenerator } from './ShippingLabelGenerator';

interface Shipment {
  _id: string;
  orderId: {
    _id: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string;
  };
  waybillNumbers: string[];
  primaryWaybill: string;
  shipmentType: string;
  status: string;
  pickupLocation: string;
  warehouse: {
    name: string;
    address: string;
    pincode: string;
    phone: string;
  };
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
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    productDescription: string;
    paymentMode: string;
    codAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  name?: string;
  phone?: string;
  add?: string;
  products_desc?: string;
  weight?: number;
  shipment_height?: number;
  shipment_width?: number;
  shipment_length?: number;
  pt?: 'COD' | 'Pre-paid';
  cod?: number;
}

export default function ShipmentManagement() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({});
  const [editLoading, setEditLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLabelGenerator, setShowLabelGenerator] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<string>('');

  // New state for Delhivery API features
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [pickupFormData, setPickupFormData] = useState({
    pickup_time: '',
    pickup_date: '',
    pickup_location: '',
    expected_package_count: 1
  });
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingWaybill, setTrackingWaybill] = useState('');
  const [documentType, setDocumentType] = useState('SIGNATURE_URL');
  const [documentWaybill, setDocumentWaybill] = useState('');
  const [testMode, setTestMode] = useState(false); // Add test mode

  useEffect(() => {
    fetchShipments();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        useNew: 'true',
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { shipmentType: typeFilter }),
        ...(searchTerm && { waybill: searchTerm })
      });

      const response = await fetch(`/api/shipment/list?${params}`);
      const result = await response.json();

      if (result.success) {
        setShipments(result.data.shipments);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        throw new Error(result.error || 'Failed to fetch shipments');
      }
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleEditShipment = async (waybill: string, data: EditFormData) => {
    try {
      setEditLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/update?waybill=${waybill}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Shipment updated successfully');
        setShowEditDialog(false);
        fetchShipments();
      } else {
        throw new Error(result.error || 'Failed to update shipment');
      }
    } catch (err: any) {
      console.error('Error updating shipment:', err);
      setError(err.message || 'Failed to update shipment');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelShipment = async (waybill: string) => {
    if (!confirm('Are you sure you want to cancel this shipment?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/update?waybill=${waybill}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Shipment cancelled successfully');
        fetchShipments();
      } else {
        throw new Error(result.error || 'Failed to cancel shipment');
      }
    } catch (err: any) {
      console.error('Error cancelling shipment:', err);
      setError(err.message || 'Failed to cancel shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLabel = (waybill: string) => {
    setSelectedWaybill(waybill);
    setShowLabelGenerator(true);
  };

  const handleLabelSuccess = (message: string) => {
    setSuccess(message);
    setShowLabelGenerator(false);
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLabelError = (message: string) => {
    setError(message);
    setShowLabelGenerator(false);
    // Clear error message after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // Delhivery Pickup Request Creation
  const handleCreatePickupRequest = async () => {
    try {
      setEditLoading(true);
      setError(null);

      const response = await fetch('/api/delhivery/pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pickupFormData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Pickup request created successfully. Pickup ID: ${result.data.pickup_id}`);
        setShowPickupDialog(false);
        setPickupFormData({
          pickup_time: '',
          pickup_date: '',
          pickup_location: '',
          expected_package_count: 1
        });
      } else {
        throw new Error(result.error || 'Failed to create pickup request');
      }
    } catch (err: any) {
      console.error('Error creating pickup request:', err);
      setError(err.message || 'Failed to create pickup request');
    } finally {
      setEditLoading(false);
    }
  };

  // Delhivery Shipment Tracking
  const handleTrackShipment = async () => {
    try {
      setEditLoading(true);
      setError(null);

      // Test mode with dummy data
      if (testMode) {
        const dummyTrackingData = {
          Status: {
            Status: 'In Transit',
            StatusLocation: 'Delhi Hub',
            StatusDateTime: new Date().toISOString(),
            Instructions: 'Package is in transit to destination'
          },
          ShipmentTrack: [
            {
              Status: 'Picked Up',
              StatusLocation: 'Mumbai Warehouse',
              StatusDateTime: '2025-01-10T10:00:00Z'
            },
            {
              Status: 'In Transit',
              StatusLocation: 'Delhi Hub',
              StatusDateTime: '2025-01-11T14:30:00Z'
            }
          ]
        };
        
        setTrackingData(dummyTrackingData);
        setSuccess('Tracking information retrieved successfully (Test Mode)');
        setEditLoading(false);
        return;
      }

      const response = await fetch(`/api/delhivery/tracking?waybill=${trackingWaybill}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
        const successMessage = result.isMockData 
          ? 'Tracking information retrieved successfully (Mock Data - API authentication failed)'
          : 'Tracking information retrieved successfully';
        setSuccess(successMessage);
      } else {
        // Provide more specific error messages
        if (result.error?.includes('Authentication failed')) {
          throw new Error('Delhivery API authentication failed. Please check the API token in environment variables.');
        } else if (result.error?.includes('Waybill not found')) {
          throw new Error('The waybill number was not found in Delhivery system. Please verify the waybill number.');
        } else {
          throw new Error(result.error || 'Failed to get tracking information');
        }
      }
    } catch (err: any) {
      console.error('Error tracking shipment:', err);
      setError(err.message || 'Failed to track shipment');
    } finally {
      setEditLoading(false);
    }
  };

  // Delhivery Document Download
  const handleDownloadDocument = async () => {
    try {
      setEditLoading(true);
      setError(null);

      const response = await fetch(`/api/delhivery/document?doc_type=${documentType}&waybill=${documentWaybill}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Check if response is JSON (mock data) or binary (actual document)
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          if (result.isMockData) {
            // Handle mock data - show a message or open mock URL
            setSuccess(`${documentType} document URL retrieved (Mock Data - API authentication failed): ${result.data.document_url}`);
            setShowDocumentDialog(false);
            return;
          }
        }
        
        // Handle actual binary document
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentType}_${documentWaybill}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess(`${documentType} document downloaded successfully`);
        setShowDocumentDialog(false);
      } else {
        const result = await response.json();
        
        if (response.status === 404 && result.suggestions) {
          // Show helpful suggestions for document not found
          const suggestionText = result.suggestions.join('\n• ');
          setError(`${result.error}.\n\nSuggestions:\n• ${suggestionText}`);
        } else {
          throw new Error(result.error || 'Failed to download document');
        }
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      setError(err.message || 'Failed to download document');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
      case 'manifested':
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'rto':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'rto':
        return <XCircle className="h-4 w-4" />;
      case 'in transit':
        return <Truck className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const openEditDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setEditFormData({
      name: shipment.customerDetails.name,
      phone: shipment.customerDetails.phone,
      add: shipment.customerDetails.address,
      products_desc: shipment.packageDetails.productDescription,
      weight: shipment.packageDetails.weight,
      shipment_height: shipment.packageDetails.dimensions.height,
      shipment_width: shipment.packageDetails.dimensions.width,
      shipment_length: shipment.packageDetails.dimensions.length,
      pt: shipment.packageDetails.paymentMode as 'COD' | 'Pre-paid',
      cod: shipment.packageDetails.codAmount
    });
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shipment Management</h1>
          <p className="text-gray-600">Manage all your shipments in one place</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded">
            <Label htmlFor="test-mode" className="text-sm">Test Mode</Label>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>
          <Button onClick={() => setShowPickupDialog(true)} variant="outline" className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Create Pickup
          </Button>
          <Button onClick={() => setShowTrackingDialog(true)} variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Track Shipment
          </Button>
          <Button onClick={() => setShowDocumentDialog(true)} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Document
          </Button>
          <Button onClick={fetchShipments} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Waybill</Label>
              <Input
                id="search"
                placeholder="Enter waybill number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Manifested">Manifested</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FORWARD">Forward</SelectItem>
                  <SelectItem value="REVERSE">Reverse</SelectItem>
                  <SelectItem value="MPS">MPS</SelectItem>
                  <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setCurrentPage(1);
              }} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments List */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments ({shipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading shipments...</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No shipments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <Card key={shipment._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{shipment.primaryWaybill}</h3>
                          <Badge className={getStatusColor(shipment.status)}>
                            {getStatusIcon(shipment.status)}
                            <span className="ml-1">{shipment.status}</span>
                          </Badge>
                          <Badge variant="outline">{shipment.shipmentType}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <strong>Customer:</strong> {shipment.customerDetails.name}
                          </div>
                          <div>
                            <strong>Order:</strong> {shipment.orderId.customerName} (₹{shipment.orderId.total})
                          </div>
                          <div>
                            <strong>Pickup:</strong> {shipment.pickupLocation}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-1">
                          <div>
                            <strong>Phone:</strong> {shipment.customerDetails.phone}
                          </div>
                          <div>
                            <strong>City:</strong> {shipment.customerDetails.city}
                          </div>
                          <div>
                            <strong>Weight:</strong> {shipment.packageDetails.weight}g
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateLabel(shipment.primaryWaybill)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Label
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTrackingWaybill(shipment.primaryWaybill);
                            setShowTrackingDialog(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-4 w-4" />
                          Track
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDocumentWaybill(shipment.primaryWaybill);
                            setShowDocumentDialog(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Document
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPickupDialog(true)}
                          className="flex items-center gap-1"
                        >
                          <PhoneCall className="h-4 w-4" />
                          Pickup
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(shipment)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        {shipment.status !== 'Cancelled' && shipment.status !== 'Delivered' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelShipment(shipment.primaryWaybill)}
                            className="flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipment - {selectedShipment?.primaryWaybill}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editFormData.add || ''}
                onChange={(e) => setEditFormData({ ...editFormData, add: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Product Description</Label>
              <Input
                id="description"
                value={editFormData.products_desc || ''}
                onChange={(e) => setEditFormData({ ...editFormData, products_desc: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={editFormData.weight || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, weight: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="payment">Payment Mode</Label>
                <Select
                  value={editFormData.pt || ''}
                  onValueChange={(value) => setEditFormData({ ...editFormData, pt: value as 'COD' | 'Pre-paid' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="Pre-paid">Pre-paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editFormData.pt === 'COD' && (
              <div>
                <Label htmlFor="cod">COD Amount</Label>
                <Input
                  id="cod"
                  type="number"
                  value={editFormData.cod || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cod: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  value={editFormData.shipment_length || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, shipment_length: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={editFormData.shipment_width || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, shipment_width: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={editFormData.shipment_height || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, shipment_height: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedShipment && handleEditShipment(selectedShipment.primaryWaybill, editFormData)}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Shipment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Shipping Label Generator */}
      <ShippingLabelGenerator
        isOpen={showLabelGenerator}
        onClose={() => setShowLabelGenerator(false)}
        waybill={selectedWaybill}
        onSuccess={handleLabelSuccess}
        onError={handleLabelError}
      />

      {/* Pickup Request Creation Dialog */}
      <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Create Pickup Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pickup_location">Pickup Location (Warehouse)</Label>
              <Input
                id="pickup_location"
                placeholder="Enter registered warehouse name"
                value={pickupFormData.pickup_location}
                onChange={(e) => setPickupFormData({ ...pickupFormData, pickup_location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_date">Pickup Date</Label>
                <Input
                  id="pickup_date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupFormData.pickup_date}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, pickup_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pickup_time">Pickup Time</Label>
                <Input
                  id="pickup_time"
                  type="time"
                  value={pickupFormData.pickup_time}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, pickup_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expected_package_count">Expected Package Count</Label>
              <Input
                id="expected_package_count"
                type="number"
                min="1"
                value={pickupFormData.expected_package_count}
                onChange={(e) => setPickupFormData({ ...pickupFormData, expected_package_count: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPickupDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePickupRequest}
              disabled={editLoading || !pickupFormData.pickup_location || !pickupFormData.pickup_date || !pickupFormData.pickup_time}
            >
              {editLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Create Pickup
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Track Shipment {testMode && <Badge variant="secondary">Test Mode</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {testMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Test Mode is enabled. This will use dummy data instead of calling the actual Delhivery API.
                  Perfect for testing the UI without using real API calls.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="tracking_waybill">Waybill Number</Label>
                <Input
                  id="tracking_waybill"
                  placeholder="Enter waybill number"
                  value={trackingWaybill}
                  onChange={(e) => setTrackingWaybill(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTrackShipment}
                  disabled={editLoading || !trackingWaybill}
                >
                  {editLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {trackingData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">Tracking Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <p className="font-medium">{trackingData.Status?.Status || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Location</Label>
                      <p className="font-medium">{trackingData.Status?.StatusLocation || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Datetime</Label>
                      <p className="font-medium">{trackingData.Status?.StatusDateTime || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Instructions</Label>
                      <p className="font-medium">{trackingData.Status?.Instructions || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {trackingData.ShipmentTrack && trackingData.ShipmentTrack.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm text-gray-600">Tracking History</Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {trackingData.ShipmentTrack.map((track: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <p className="font-medium text-sm">{track.Status}</p>
                              <p className="text-xs text-gray-500">{track.StatusLocation}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{track.StatusDateTime}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowTrackingDialog(false);
              setTrackingData(null);
              setTrackingWaybill('');
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Download Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document_waybill">Waybill Number</Label>
              <Input
                id="document_waybill"
                placeholder="Enter waybill number"
                value={documentWaybill}
                onChange={(e) => setDocumentWaybill(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGNATURE_URL">Signature (Available after delivery)</SelectItem>
                  <SelectItem value="EPOD">EPOD - Electronic Proof of Delivery</SelectItem>
                  <SelectItem value="RVP_QC_IMAGE">RVP QC Image - Quality Check</SelectItem>
                  <SelectItem value="SELLER_RETURN_IMAGE">Seller Return Image</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                📝 Note: Document availability depends on shipment status and type
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownloadDocument}
              disabled={editLoading || !documentWaybill}
            >
              {editLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
