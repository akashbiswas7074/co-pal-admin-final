'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, Truck, MapPin, Clock, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import PincodeServiceabilityCheck from './PincodeServiceabilityCheck';
import WarehouseDebug from './WarehouseDebug';
import type {
  ShipmentCreateRequest,
  ShipmentData,
  TrackingInfo,
  WarehouseInfo,
  ShipmentDimensions,
  ShipmentPackage
} from '@/types/shipment';

interface ShipmentManagerProps {
  orderId: string;
  onShipmentCreated?: (data: any) => void;
  className?: string;
}

export default function ShipmentManager({
  orderId,
  onShipmentCreated,
  className = ''
}: ShipmentManagerProps) {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [activeTab, setActiveTab] = useState('create');

  // Form states
  const [formData, setFormData] = useState<ShipmentCreateRequest>({
    orderId,
    shipmentType: 'FORWARD',
    pickupLocation: '',
    shippingMode: 'Surface',
    weight: 500,
    dimensions: {
      length: 10,
      width: 10,
      height: 10
    },
    customFields: {
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false,
      auto_generate_hsn: true,
      auto_generate_waybill: true
    }
  });

  const [pincodeServiceable, setPincodeServiceable] = useState(true); // Track pincode serviceability

  // MPS form states
  const [mpsPackages, setMpsPackages] = useState<ShipmentPackage[]>([
    { weight: 500, dimensions: { length: 10, width: 10, height: 10 } }
  ]);

  // Load initial data
  useEffect(() => {
    fetchShipmentData();
  }, [orderId]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/details?orderId=${orderId}`);
      const result = await response.json();

      console.log('[ShipmentManager] API Response:', result);
      console.log('[ShipmentManager] Warehouses received:', result.data?.warehouses);
      console.log('[ShipmentManager] Warehouses type:', typeof result.data?.warehouses);
      console.log('[ShipmentManager] Warehouses length:', result.data?.warehouses?.length);

      if (!result.success) {
        throw new Error(result.error);
      }

      setShipmentData(result.data);

      // Debug log for warehouse setting
      console.log('[ShipmentManager] Setting shipment data, warehouses:', result.data?.warehouses);

      // Set default pickup location if available
      if (result.data.warehouses?.length > 0 && !formData.pickupLocation) {
        console.log('[ShipmentManager] Setting pickup location to:', result.data.warehouses[0].name);
        setFormData(prev => ({
          ...prev,
          pickupLocation: result.data.warehouses[0].name
        }));
      } else if (!result.data.warehouses?.length && !formData.pickupLocation) {
        console.log('[ShipmentManager] No warehouses available, setting fallback pickup location');
        setFormData(prev => ({
          ...prev,
          pickupLocation: 'Main Warehouse'
        }));
      }

      // Pre-fill weight and dimensions from product details
      if (result.data.packageDetails) {
        console.log('[ShipmentManager] Setting package details from product:', result.data.packageDetails);
        setFormData(prev => ({
          ...prev,
          weight: result.data.packageDetails.weight || prev.weight,
          dimensions: {
            length: result.data.packageDetails.dimensions?.length || prev.dimensions?.length || 10,
            width: result.data.packageDetails.dimensions?.width || prev.dimensions?.width || 10,
            height: result.data.packageDetails.dimensions?.height || prev.dimensions?.height || 10
          },
          // @ts-ignore
          productDescription: result.data.packageDetails.productDescription
        }));
      }

    } catch (err: any) {
      console.error('[ShipmentManager] Error in fetchShipmentData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = {
        ...formData,
        packages: formData.shipmentType === 'MPS' ? mpsPackages : undefined
      };

      const response = await fetch('/api/shipment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`${formData.shipmentType} shipment created successfully!`);

      // Refresh shipment data
      await fetchShipmentData();

      // Call callback if provided
      if (onShipmentCreated) {
        onShipmentCreated(result.data);
      }

      // Switch to tracking tab
      setActiveTab('track');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackShipment = async (waybill: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/tracking?waybill=${waybill}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setTrackingInfo(result.data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMpsPackage = () => {
    setMpsPackages([...mpsPackages, {
      weight: 500,
      dimensions: { length: 10, width: 10, height: 10 }
    }]);
  };

  const removeMpsPackage = (index: number) => {
    setMpsPackages(mpsPackages.filter((_, i) => i !== index));
  };

  const updateMpsPackage = (index: number, field: string, value: any) => {
    setMpsPackages(mpsPackages.map((pkg, i) =>
      i === index ? { ...pkg, [field]: value } : pkg
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'pickup scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !shipmentData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading shipment data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Shipment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Shipment Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Order Status</p>
              <Badge className={getStatusColor(shipmentData?.status || 'unknown')}>
                {shipmentData?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Payment Method</p>
              <Badge variant="outline" className="capitalize">
                {(shipmentData as any)?.paymentMethod || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Shipment Created</p>
              <p className="font-medium">
                {shipmentData?.hasShipment ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Available Actions</p>
              <div className="flex flex-wrap gap-1">
                {shipmentData?.availableActions?.map((action) => (
                  <Badge key={action} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address and Pincode Serviceability */}
      {shipmentData?.shippingAddress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Shipping Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{shipmentData.shippingAddress.name}</p>
              <p className="text-sm text-gray-600">{shipmentData.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">
                {shipmentData.shippingAddress.city}, {shipmentData.shippingAddress.state} - {shipmentData.shippingAddress.pincode}
              </p>
              <p className="text-sm text-gray-600">
                📞 {shipmentData.shippingAddress.phone}
              </p>
            </CardContent>
          </Card>

          <PincodeServiceabilityCheck
            pincode={shipmentData.shippingAddress.pincode}
            onServiceabilityChange={(serviceable) => {
              setPincodeServiceable(serviceable);
            }}
          />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Shipment</TabsTrigger>
          <TabsTrigger value="track">Track Shipment</TabsTrigger>
          <TabsTrigger value="manage">Manage Shipment</TabsTrigger>
        </TabsList>

        {/* Create Shipment Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipmentType">Shipment Type</Label>
                  <Select
                    value={formData.shipmentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shipmentType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shipmentData?.availableActions?.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Select
                    value={formData.pickupLocation}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>

                      {(shipmentData?.warehouses && shipmentData.warehouses.length > 0) ? (
                        shipmentData.warehouses.map((warehouse, index) => {
                          console.log(`[ShipmentManager] Rendering warehouse ${index + 1}:`, warehouse);
                          return (
                            <SelectItem key={warehouse.name} value={warehouse.name}>
                              <div className="flex flex-col">
                                <span>{warehouse.name}</span>
                                <span className="text-xs text-gray-500">
                                  {warehouse.address} - {warehouse.pincode}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <>

                          <SelectItem value="Main Warehouse">
                            <div className="flex flex-col">
                              <span>Main Warehouse</span>
                              <span className="text-xs text-gray-500">Mumbai - 400001 (Default)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Delhi Hub">
                            <div className="flex flex-col">
                              <span>Delhi Hub</span>
                              <span className="text-xs text-gray-500">Delhi - 110001 (Default)</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-600">

                    {(shipmentData?.warehouses && shipmentData.warehouses.length > 0) ? (
                      <span className="text-green-600">
                        ✅ {shipmentData.warehouses.length} warehouse(s) loaded from Delhivery
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        ⚠️ Using default warehouses (Delhivery warehouses not loaded)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingMode">Shipping Mode</Label>
                  <Select
                    value={formData.shippingMode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shippingMode: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Surface">Surface</SelectItem>
                      <SelectItem value="Express">Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product Description</Label>
                  <Input
                    id="productDescription"
                    // @ts-ignore
                    value={formData.productDescription || ''}
                    // @ts-ignore
                    onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                    placeholder="Product description"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label>Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Length"
                    value={formData.dimensions?.length}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions!, length: parseInt(e.target.value) }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Width"
                    value={formData.dimensions?.width}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions!, width: parseInt(e.target.value) }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={formData.dimensions?.height}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions!, height: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              {/* MPS Packages */}
              {formData.shipmentType === 'MPS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>MPS Packages</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMpsPackage}
                    >
                      Add Package
                    </Button>
                  </div>
                  {mpsPackages.map((pkg, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Package {index + 1}</span>
                        {mpsPackages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMpsPackage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={pkg.weight}
                          onChange={(e) => updateMpsPackage(index, 'weight', parseInt(e.target.value))}
                        />
                        <Input
                          type="number"
                          placeholder="Length"
                          value={pkg.dimensions.length}
                          onChange={(e) => updateMpsPackage(index, 'dimensions', {
                            ...pkg.dimensions,
                            length: parseInt(e.target.value)
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Width"
                          value={pkg.dimensions.width}
                          onChange={(e) => updateMpsPackage(index, 'dimensions', {
                            ...pkg.dimensions,
                            width: parseInt(e.target.value)
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Height"
                          value={pkg.dimensions.height}
                          onChange={(e) => updateMpsPackage(index, 'dimensions', {
                            ...pkg.dimensions,
                            height: parseInt(e.target.value)
                          })}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Custom Fields */}
              <div className="space-y-4">
                <Label>Special Handling</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={formData.customFields?.fragile_shipment}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, fragile_shipment: checked as boolean }
                      }))}
                    />
                    <Label htmlFor="fragile">Fragile Shipment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dangerous"
                      checked={formData.customFields?.dangerous_good}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, dangerous_good: checked as boolean }
                      }))}
                    />
                    <Label htmlFor="dangerous">Dangerous Good</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="plastic"
                      checked={formData.customFields?.plastic_packaging}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        customFields: { ...prev.customFields, plastic_packaging: checked as boolean }
                      }))}
                    />
                    <Label htmlFor="plastic">Plastic Packaging</Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleCreateShipment}
                disabled={loading || !shipmentData?.canCreateShipment || !pincodeServiceable}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Shipment...</span>
                  </div>
                ) : !pincodeServiceable ? (
                  `Cannot Create Shipment - Pincode Not Serviceable`
                ) : (
                  `Create ${formData.shipmentType} Shipment`
                )}
              </Button>

              {/* Pincode Serviceability Warning */}
              {!pincodeServiceable && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    <strong>Cannot create shipment:</strong> The delivery pincode is not serviceable by Delhivery. Please verify the address or contact the customer for an alternative address.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Track Shipment Tab */}
        <TabsContent value="track" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Track Shipment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Waybills */}
              {shipmentData?.shipmentDetails?.waybillNumbers && (
                <div className="space-y-2">
                  <Label>Existing Waybills</Label>
                  <div className="flex flex-wrap gap-2">
                    {shipmentData.shipmentDetails.waybillNumbers.map((waybill) => (
                      <Button
                        key={waybill}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackShipment(waybill)}
                      >
                        {waybill}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking Information */}
              {trackingInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(trackingInfo.status)}>
                        {trackingInfo.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Current Location</Label>
                      <p className="text-sm text-gray-600">{trackingInfo.currentLocation || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="space-y-2">
                    <Label>Tracking Timeline</Label>
                    <div className="space-y-2">
                      {trackingInfo.scans.map((scan, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{scan.status}</span>
                              <span className="text-sm text-gray-500">{scan.date}</span>
                            </div>
                            <p className="text-sm text-gray-600">{scan.location}</p>
                            <p className="text-xs text-gray-500">{scan.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Shipment Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Manage Shipment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Shipment management features like editing and cancellation will be available here.
                  </AlertDescription>
                </Alert>

                {/* Shipment Details */}
                {shipmentData?.shipmentDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Pickup Location</Label>
                        <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.pickupLocation}</p>
                      </div>
                      <div>
                        <Label>Shipping Mode</Label>
                        <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.shippingMode}</p>
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.weight}g</p>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm text-gray-600">
                          {new Date(shipmentData.shipmentDetails.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Waybill Numbers</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {shipmentData.shipmentDetails.waybillNumbers.map((waybill) => (
                          <Badge key={waybill} variant="outline">
                            {waybill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
