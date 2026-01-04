'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Package, 
  Truck, 
  Search, 
  RefreshCw, 
  Plus, 
  Edit, 
  X, 
  FileText, 
  Eye,
  MapPin,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Shipment {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    country: string;
  };
  waybillNumber?: string;
  trackingNumber?: string;
  shipmentCreated: boolean;
  shipmentStatus: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  paymentMode: string;
  paymentStatus: string;
  pickupLocation: string;
  shippingMode: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  fragileShipment: boolean;
  dangerousGoods: boolean;
  cod_amount: number;
  availableActions: string[];
  products: Array<{
    product: {
      name: string;
      images: string[];
      price: number;
    };
    qty: number;
  }>;
}

export default function ShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [shipments, searchTerm, statusFilter]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/shipments');
      if (!response.ok) {
        throw new Error(`Failed to fetch shipments: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setShipments(data);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(err.message || 'Failed to fetch shipments');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterShipments = () => {
    let filtered = shipments;

    if (searchTerm) {
      filtered = filtered.filter(shipment =>
        shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.waybillNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.shippingAddress.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment =>
        shipment.shipmentStatus.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredShipments(filtered);
  };

  const handleCreateShipment = async (orderId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          shipmentType: 'FORWARD',
          pickupLocation: 'Main Warehouse',
          shippingMode: 'Surface'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Shipment created successfully!');
        fetchShipments();
        setShowCreateDialog(false);
      } else {
        toast.error(data.error || 'Failed to create shipment');
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShipment = async (waybill: string) => {
    if (!confirm('Are you sure you want to cancel this shipment?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/shipments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waybill,
          cancellation: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Shipment cancelled successfully!');
        fetchShipments();
      } else {
        toast.error(data.error || 'Failed to cancel shipment');
      }
    } catch (error: any) {
      console.error('Error cancelling shipment:', error);
      toast.error('Failed to cancel shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipment = async (waybill: string, updates: any) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/shipments/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waybill,
          updates
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Shipment updated successfully!');
        fetchShipments();
        setShowUpdateDialog(false);
      } else {
        toast.error(data.error || 'Failed to update shipment');
      }
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      toast.error('Failed to update shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLabel = async (waybill: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/shipments/label?waybill=${waybill}&pdf=true&pdf_size=A4`);
      const data = await response.json();

      if (data.success) {
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank');
          toast.success('Shipping label generated successfully!');
        } else {
          toast.error('PDF URL not received');
        }
      } else {
        toast.error(data.error || 'Failed to generate label');
      }
    } catch (error: any) {
      console.error('Error generating label:', error);
      toast.error('Failed to generate label');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackShipment = async (waybill: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/shipments/track?waybill=${waybill}`);
      const data = await response.json();

      if (data.success) {
        setTrackingData(data.trackingData);
        setShowTrackingDialog(true);
      } else {
        toast.error(data.error || 'Failed to track shipment');
      }
    } catch (error: any) {
      console.error('Error tracking shipment:', error);
      toast.error('Failed to track shipment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'created':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'dispatched':
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'processing':
      case 'created':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shipment Management</h1>
          <p className="text-gray-600">Manage and track all shipments</p>
        </div>
        <Button 
          onClick={fetchShipments}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="font-medium">{shipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="font-medium">
                  {shipments.filter(s => s.shipmentStatus === 'delivered').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="font-medium">
                  {shipments.filter(s => s.shipmentStatus === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="font-medium">
                  {shipments.filter(s => s.shipmentStatus === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by customer name, waybill, order ID, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && shipments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading shipments...</span>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No shipments found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search terms or filters
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Waybill</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment._id}>
                      <TableCell className="font-medium">
                        {shipment.orderNumber || shipment.orderId.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shipment.customerName}</div>
                          <div className="text-sm text-gray-500">{shipment.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shipment.waybillNumber ? (
                          <div className="font-mono text-sm">
                            {shipment.waybillNumber}
                          </div>
                        ) : (
                          <span className="text-gray-500">Not generated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(shipment.shipmentStatus)} flex items-center space-x-1`}>
                          {getStatusIcon(shipment.shipmentStatus)}
                          <span className="capitalize">{shipment.shipmentStatus}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="capitalize">{shipment.paymentMode}</div>
                          <div className="text-gray-500 capitalize">{shipment.paymentStatus}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{shipment.totalAmount.toFixed(2)}</div>
                        {shipment.cod_amount > 0 && (
                          <div className="text-sm text-orange-600">
                            COD: ₹{shipment.cod_amount.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{shipment.shippingAddress.city}</div>
                          <div className="text-gray-500">{shipment.shippingAddress.state}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {shipment.availableActions.includes('create_shipment') && (
                            <Button
                              size="sm"
                              onClick={() => handleCreateShipment(shipment.orderId)}
                              className="flex items-center space-x-1"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Create</span>
                            </Button>
                          )}
                          
                          {shipment.availableActions.includes('update_shipment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setShowUpdateDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {shipment.availableActions.includes('cancel_shipment') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelShipment(shipment.waybillNumber!)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {shipment.availableActions.includes('generate_label') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateLabel(shipment.waybillNumber!)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {shipment.availableActions.includes('track_shipment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTrackShipment(shipment.waybillNumber!)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Shipment Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Shipment</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <UpdateShipmentForm 
              shipment={selectedShipment}
              onUpdate={handleUpdateShipment}
              onCancel={() => setShowUpdateDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shipment Tracking</DialogTitle>
          </DialogHeader>
          {trackingData && (
            <TrackingDetails 
              trackingData={trackingData}
              onClose={() => setShowTrackingDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Update Shipment Form Component
function UpdateShipmentForm({ shipment, onUpdate, onCancel }: {
  shipment: Shipment;
  onUpdate: (waybill: string, updates: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: shipment.customerName,
    phone: shipment.shippingAddress.phone,
    add: shipment.shippingAddress.address1,
    weight: shipment.weight,
    shipment_height: shipment.dimensions.height,
    shipment_width: shipment.dimensions.width,
    shipment_length: shipment.dimensions.length,
    cod: shipment.cod_amount,
    pt: shipment.paymentMode.toUpperCase()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(shipment.waybillNumber!, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Customer Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="add">Address</Label>
        <Input
          id="add"
          value={formData.add}
          onChange={(e) => setFormData({ ...formData, add: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Weight (grams)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="pt">Payment Mode</Label>
          <Select value={formData.pt} onValueChange={(value) => setFormData({ ...formData, pt: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COD">COD</SelectItem>
              <SelectItem value="PREPAID">Prepaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="shipment_height">Height (cm)</Label>
          <Input
            id="shipment_height"
            type="number"
            value={formData.shipment_height}
            onChange={(e) => setFormData({ ...formData, shipment_height: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="shipment_width">Width (cm)</Label>
          <Input
            id="shipment_width"
            type="number"
            value={formData.shipment_width}
            onChange={(e) => setFormData({ ...formData, shipment_width: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="shipment_length">Length (cm)</Label>
          <Input
            id="shipment_length"
            type="number"
            value={formData.shipment_length}
            onChange={(e) => setFormData({ ...formData, shipment_length: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {formData.pt === 'COD' && (
        <div>
          <Label htmlFor="cod">COD Amount</Label>
          <Input
            id="cod"
            type="number"
            value={formData.cod}
            onChange={(e) => setFormData({ ...formData, cod: parseInt(e.target.value) })}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Shipment
        </Button>
      </div>
    </form>
  );
}

// Tracking Details Component
function TrackingDetails({ trackingData, onClose }: {
  trackingData: any;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Waybill Number</Label>
          <div className="font-mono text-sm p-2 bg-gray-100 rounded">
            {trackingData.waybill}
          </div>
        </div>
        <div>
          <Label>Current Status</Label>
          <div className="font-medium p-2 bg-gray-100 rounded">
            {trackingData.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Origin</Label>
          <div className="text-sm p-2 bg-gray-100 rounded">
            {trackingData.origin}
          </div>
        </div>
        <div>
          <Label>Destination</Label>
          <div className="text-sm p-2 bg-gray-100 rounded">
            {trackingData.destination}
          </div>
        </div>
      </div>

      <div>
        <Label>Current Location</Label>
        <div className="text-sm p-2 bg-gray-100 rounded">
          {trackingData.currentLocation}
        </div>
      </div>

      {trackingData.estimatedDeliveryDate && (
        <div>
          <Label>Estimated Delivery Date</Label>
          <div className="text-sm p-2 bg-gray-100 rounded">
            {new Date(trackingData.estimatedDeliveryDate).toLocaleDateString()}
          </div>
        </div>
      )}

      {trackingData.cod && (
        <div>
          <Label>COD Amount</Label>
          <div className="text-sm p-2 bg-gray-100 rounded">
            ₹{trackingData.cod}
          </div>
        </div>
      )}

      {trackingData.scans && trackingData.scans.length > 0 && (
        <div>
          <Label>Tracking History</Label>
          <div className="max-h-60 overflow-y-auto border rounded p-2">
            {trackingData.scans.map((scan: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="text-sm">
                  <div className="font-medium">{scan.ScanType}</div>
                  <div className="text-gray-500">{scan.Instructions}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(scan.ScanDateTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
