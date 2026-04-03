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
  PackageX
} from 'lucide-react';

interface ShipmentDetails {
  waybillNumbers: string[];
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  packages?: Array<{
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    waybill?: string;
  }>;
  masterWaybill?: string;
  childWaybills?: string[];
  createdAt: string;
  delhiveryResponse?: any;
}

interface ShipmentData {
  orderId: string;
  status: string;
  shipmentCreated: boolean;
  shipmentDetails?: ShipmentDetails;
  reverseShipment?: any;
  replacementShipment?: any;
  availableActions: string[];
  warehouses: Array<{
    name: string;
    location: string;
  }>;
  canCreateShipment: boolean;
}

interface ShipmentCreateRequest {
  orderId: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  packages?: Array<{
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }>;
  customFields?: {
    fragile_shipment?: boolean;
    dangerous_good?: boolean;
    plastic_packaging?: boolean;
    hsn_code?: string;
    ewb?: string;
  };
}

interface ShipmentManagerProps {
  orderId: string;
  onShipmentCreated?: (data: any) => void;
  className?: string;
}

export function ShipmentManager({ orderId, onShipmentCreated, className }: ShipmentManagerProps) {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [createData, setCreateData] = useState<ShipmentCreateRequest>({
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
    packages: [],
    customFields: {
      fragile_shipment: false,
      dangerous_good: false,
      plastic_packaging: false,
      hsn_code: '',
      ewb: ''
    }
  });

  // Fetch shipment data
  const fetchShipmentData = async () => {
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

  // Create shipment
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
        setShipmentData(prev => prev ? {
          ...prev,
          shipmentCreated: createData.shipmentType === 'FORWARD' || createData.shipmentType === 'MPS',
          shipmentDetails: createData.shipmentType === 'FORWARD' || createData.shipmentType === 'MPS' 
            ? result.data.delhiveryResponse 
            : prev.shipmentDetails,
          reverseShipment: createData.shipmentType === 'REVERSE' 
            ? result.data.delhiveryResponse 
            : prev.reverseShipment,
          replacementShipment: createData.shipmentType === 'REPLACEMENT' 
            ? result.data.delhiveryResponse 
            : prev.replacementShipment,
          availableActions: prev.availableActions.filter(action => action !== createData.shipmentType)
        } : null);
        
        setShowCreateForm(false);
        setSelectedAction('');
        
        if (onShipmentCreated) {
          onShipmentCreated(result.data);
        }
        
        // Refresh data
        await fetchShipmentData();
      } else {
        setError(result.error || 'Failed to create shipment');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setCreating(false);
    }
  };

  // Add package for MPS
  const addPackage = () => {
    setCreateData(prev => ({
      ...prev,
      packages: [
        ...(prev.packages || []),
        {
          weight: 500,
          dimensions: { length: 10, width: 10, height: 10 }
        }
      ]
    }));
  };

  // Remove package for MPS
  const removePackage = (index: number) => {
    setCreateData(prev => ({
      ...prev,
      packages: prev.packages?.filter((_, i) => i !== index) || []
    }));
  };

  // Update package details
  const updatePackage = (index: number, field: string, value: any) => {
    setCreateData(prev => ({
      ...prev,
      packages: prev.packages?.map((pkg, i) => 
        i === index 
          ? { 
              ...pkg, 
              [field]: field === 'dimensions' ? value : value
            }
          : pkg
      ) || []
    }));
  };

  // Handle action selection
  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    setCreateData(prev => ({
      ...prev,
      shipmentType: action as any,
      packages: action === 'MPS' ? [{ weight: 500, dimensions: { length: 10, width: 10, height: 10 } }] : []
    }));
    setShowCreateForm(true);
  };

  useEffect(() => {
    if (orderId) {
      fetchShipmentData();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading shipment data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="font-medium text-red-700">Error</span>
        </div>
        <p className="text-red-600 mt-1">{error}</p>
        <button
          onClick={fetchShipmentData}
          className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!shipmentData) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <p className="text-gray-600">No shipment data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">Enhanced Shipment Management</h3>
        </div>
        <button
          onClick={fetchShipmentData}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Current Shipments Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forward Shipment */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Forward Shipment</h4>
          </div>
          {shipmentData.shipmentCreated && shipmentData.shipmentDetails ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-700">Created</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Type: {shipmentData.shipmentDetails.shipmentType}</p>
                <p>Waybills: {shipmentData.shipmentDetails.waybillNumbers.length}</p>
                <p>Mode: {shipmentData.shipmentDetails.shippingMode}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Not created</span>
            </div>
          )}
        </div>

        {/* Reverse Shipment */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <RotateCcw className="h-5 w-5 text-orange-600 mr-2" />
            <h4 className="font-medium text-gray-900">Reverse Shipment</h4>
          </div>
          {shipmentData.reverseShipment ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-700">Created</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Waybills: {shipmentData.reverseShipment.waybillNumbers?.length || 0}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Not created</span>
            </div>
          )}
        </div>

        {/* Replacement Shipment */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Replace className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Replacement</h4>
          </div>
          {shipmentData.replacementShipment ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-700">Created</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Waybills: {shipmentData.replacementShipment.waybillNumbers?.length || 0}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Not created</span>
            </div>
          )}
        </div>
      </div>

      {/* Available Actions */}
      {shipmentData.availableActions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Available Shipment Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {shipmentData.availableActions.map((action) => (
              <button
                key={action}
                onClick={() => handleActionSelect(action)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {action === 'FORWARD' && <Send className="h-6 w-6 text-blue-600 mb-2" />}
                {action === 'REVERSE' && <RotateCcw className="h-6 w-6 text-orange-600 mb-2" />}
                {action === 'REPLACEMENT' && <Replace className="h-6 w-6 text-purple-600 mb-2" />}
                {action === 'MPS' && <Package className="h-6 w-6 text-green-600 mb-2" />}
                <span className="text-sm font-medium text-gray-700">
                  {action === 'MPS' ? 'Multi-Package' : action}
                </span>
                <span className="text-xs text-gray-500 text-center">
                  {action === 'FORWARD' && 'Standard shipping'}
                  {action === 'REVERSE' && 'Return pickup'}
                  {action === 'REPLACEMENT' && 'Exchange item'}
                  {action === 'MPS' && 'Multiple boxes'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Shipment Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              Create {createData.shipmentType} Shipment
            </h4>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setSelectedAction('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <select
                  value={createData.pickupLocation}
                  onChange={(e) => setCreateData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select warehouse</option>
                  {shipmentData.warehouses.map((warehouse) => (
                    <option key={warehouse.name} value={warehouse.name}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Mode
                </label>
                <select
                  value={createData.shippingMode}
                  onChange={(e) => setCreateData(prev => ({ ...prev, shippingMode: e.target.value as 'Surface' | 'Express' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Surface">Surface</option>
                  <option value="Express">Express</option>
                </select>
              </div>
            </div>

            {/* Package Details */}
            {createData.shipmentType !== 'MPS' && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Package Details</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (gms)
                    </label>
                    <input
                      type="number"
                      value={createData.weight}
                      onChange={(e) => setCreateData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={createData.dimensions?.length}
                      onChange={(e) => setCreateData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          length: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={createData.dimensions?.width}
                      onChange={(e) => setCreateData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          width: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={createData.dimensions?.height}
                      onChange={(e) => setCreateData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          height: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MPS Packages */}
            {createData.shipmentType === 'MPS' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Multi-Package Details</h5>
                  <button
                    type="button"
                    onClick={addPackage}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Package
                  </button>
                </div>
                
                <div className="space-y-4">
                  {createData.packages?.map((pkg, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Package {index + 1}</span>
                        {createData.packages!.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePackage(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weight (gms)
                          </label>
                          <input
                            type="number"
                            value={pkg.weight}
                            onChange={(e) => updatePackage(index, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Length (cm)
                          </label>
                          <input
                            type="number"
                            value={pkg.dimensions.length}
                            onChange={(e) => updatePackage(index, 'dimensions', { 
                              ...pkg.dimensions, 
                              length: parseInt(e.target.value) || 0 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Width (cm)
                          </label>
                          <input
                            type="number"
                            value={pkg.dimensions.width}
                            onChange={(e) => updatePackage(index, 'dimensions', { 
                              ...pkg.dimensions, 
                              width: parseInt(e.target.value) || 0 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            value={pkg.dimensions.height}
                            onChange={(e) => updatePackage(index, 'dimensions', { 
                              ...pkg.dimensions, 
                              height: parseInt(e.target.value) || 0 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Additional Options</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createData.customFields?.fragile_shipment || false}
                      onChange={(e) => setCreateData(prev => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          fragile_shipment: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fragile shipment</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createData.customFields?.dangerous_good || false}
                      onChange={(e) => setCreateData(prev => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          dangerous_good: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dangerous goods</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createData.customFields?.plastic_packaging || false}
                      onChange={(e) => setCreateData(prev => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          plastic_packaging: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Plastic packaging</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={createData.customFields?.hsn_code || ''}
                      onChange={(e) => setCreateData(prev => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          hsn_code: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional HSN code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-waybill Number
                    </label>
                    <input
                      type="text"
                      value={createData.customFields?.ewb || ''}
                      onChange={(e) => setCreateData(prev => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          ewb: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="For packages ≥ ₹50k"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedAction('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createShipment}
                disabled={creating || !createData.pickupLocation}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create {createData.shipmentType} Shipment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Details */}
      {shipmentData.shipmentCreated && shipmentData.shipmentDetails && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Shipment Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Waybill Numbers:</span>
                <div className="mt-1">
                  {shipmentData.shipmentDetails.waybillNumbers.map((waybill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded mb-1">
                      <span className="font-mono text-sm">{waybill}</span>
                      <button
                        onClick={() => window.open(`https://www.delhivery.com/track/package/${waybill}`, '_blank')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Pickup Location:</span>
                <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.pickupLocation}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Shipping Mode:</span>
                <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.shippingMode}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Shipment Type:</span>
                <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.shipmentType}</p>
              </div>
              
              {shipmentData.shipmentDetails.shipmentType === 'MPS' && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Master Waybill:</span>
                    <p className="text-sm text-gray-600 font-mono">{shipmentData.shipmentDetails.masterWaybill}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total Packages:</span>
                    <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.packages?.length || 0}</p>
                  </div>
                </>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <p className="text-sm text-gray-600">
                  {new Date(shipmentData.shipmentDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="font-medium text-red-700">Error</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
    width: number;
    height: number;
  };
  pickupLocation: string;
}

interface ShipmentManagerProps {
  orderId: string;
  onShipmentCreated?: (data: any) => void;
  className?: string;
}

const ShipmentManager: React.FC<ShipmentManagerProps> = ({
  orderId,
  onShipmentCreated,
  className = ''
}) => {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showEditShipment, setShowEditShipment] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [waybillNumber, setWaybillNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');

  const [createData, setCreateData] = useState<ShipmentCreateData>({
    shippingMode: 'Surface',
    weight: 500,
    dimensions: {
      length: 10,
      width: 10,
      height: 10
    },
    pickupLocation: 'Default Warehouse'
  });

  // Fetch shipment data
  const fetchShipmentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shipment?orderId=${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setShipmentData(result.data);
        
        // Also fetch available status updates
        const statusResponse = await fetch(`/api/shipment/status?orderId=${orderId}`);
        const statusResult = await statusResponse.json();
        
        if (statusResult.success) {
          setShipmentData(prev => ({
            ...prev!,
            nextStatuses: statusResult.data.nextStatuses,
            canUpdateStatus: statusResult.data.canUpdateStatus
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

  // Create shipment
  const createShipment = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ...createData
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShipmentData({
          ...shipmentData!,
          shipmentCreated: true,
          shipmentDetails: result.data.delhiveryResponse,
          canCreateShipment: false
        });
        setShowCreateForm(false);
        
        if (onShipmentCreated) {
          onShipmentCreated(result.data);
        }
        
        // Refresh data
        await fetchShipmentData();
      } else {
        setError(result.error || 'Failed to create shipment');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setCreating(false);
    }
  };

  // Update shipment status
  const updateShipmentStatus = async () => {
    if (!selectedStatus) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/shipment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          newStatus: selectedStatus,
          waybillNumber: waybillNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          reason: statusReason || undefined,
          updatedBy: 'admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShipmentData(prev => ({
          ...prev!,
          status: selectedStatus,
          shipmentCreated: result.order.shipmentCreated,
          shipmentDetails: result.order.shipmentDetails
        }));
        setShowStatusUpdate(false);
        setSelectedStatus('');
        setStatusReason('');
        setWaybillNumber('');
        setTrackingUrl('');
        
        if (onShipmentCreated) {
          onShipmentCreated(result.order);
        }
        
        // Refresh data
        await fetchShipmentData();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setUpdating(false);
    }
  };

  // Handle shipment edit completion
  const handleShipmentEdited = () => {
    setShowEditShipment(false);
    // Refresh shipment data to show updated details
    fetchShipmentData();
  };

  // Check if shipment can be edited (status restrictions)
  const canEditShipment = () => {
    if (!shipmentData?.shipmentCreated || !shipmentData?.status) return false;
    
    // Based on Delhivery API documentation, shipments can be edited in these statuses
    const editableStatuses = [
      'Confirmed',
      'PickedUp', 
      'Dispatched',
      'InTransit',
      'OutForDelivery'
    ];
    
    return editableStatuses.includes(shipmentData.status);
  };

  useEffect(() => {
    if (orderId) {
      fetchShipmentData();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading shipment data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={fetchShipmentData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!shipmentData) {
    return (
      <div className={`text-gray-500 text-center p-4 ${className}`}>
        No shipment data available
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Shipment Management</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              shipmentData.shipmentCreated 
                ? 'bg-green-100 text-green-800' 
                : shipmentData.canCreateShipment 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {shipmentData.shipmentCreated ? 'Shipped' : shipmentData.canCreateShipment ? 'Ready to Ship' : 'Not Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Order Status */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Order Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              shipmentData.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
              shipmentData.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {shipmentData.status}
            </span>
          </div>
        </div>

        {/* Shipment Edit Manager Modal */}
        {showEditShipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Shipment Details</h2>
                  <button
                    onClick={() => setShowEditShipment(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ShipmentEditManager
                  orderId={orderId}
                  onEditComplete={handleShipmentEdited}
                />
              </div>
            </div>
          </div>
        )}

        {/* Shipment Created - Show Details */}
        {shipmentData.shipmentCreated && shipmentData.shipmentDetails && (
          <div className="space-y-4">
            {/* Waybill Numbers */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Shipment Created Successfully</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Waybill Numbers:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {shipmentData.shipmentDetails.waybillNumbers.map((waybill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-mono"
                      >
                        {waybill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Shipping Mode:</span>
                    <p className="text-sm text-gray-600">{shipmentData.shipmentDetails.shippingMode}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Created:</span>
                    <p className="text-sm text-gray-600">
                      {new Date(shipmentData.shipmentDetails.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const waybill = shipmentData.shipmentDetails?.waybillNumbers[0];
                  if (waybill) {
                    window.open(`https://www.delhivery.com/track/package/${waybill}`, '_blank');
                  }
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Track Shipment
              </button>
              
              {/* Edit Shipment Button */}
              {canEditShipment() && (
                <button
                  onClick={() => setShowEditShipment(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Shipment
                </button>
              )}
              
              {/* Update Status Button */}
              {shipmentData.canUpdateStatus && shipmentData.nextStatuses && shipmentData.nextStatuses.length > 0 && (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </button>
              )}
            </div>
          </div>
        )}

        {/* Can Create Shipment - Show Create Form */}
        {shipmentData.canCreateShipment && !shipmentData.shipmentCreated && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Ready for Shipment</span>
              </div>
              <p className="text-sm text-yellow-700">
                Order is ready to be shipped. Create a shipment to proceed.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Create Shipment
              </button>
              
              {/* Update Status Button for non-shipped orders */}
              {shipmentData.canUpdateStatus && shipmentData.nextStatuses && shipmentData.nextStatuses.length > 0 && (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cannot Create Shipment */}
        {!shipmentData.canCreateShipment && !shipmentData.shipmentCreated && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700">Shipment already created</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              A shipment has already been created for this order.
            </p>
          </div>
        )}

        {/* Create Shipment Form */}
        {showCreateForm && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Create Shipment</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shipping Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Mode
                </label>
                <select
                  value={createData.shippingMode}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    shippingMode: e.target.value as 'Surface' | 'Express'
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Surface">Surface</option>
                  <option value="Express">Express</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (grams)
                </label>
                <input
                  type="number"
                  value={createData.weight}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    weight: Number(e.target.value)
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (cm)
                </label>
                <input
                  type="number"
                  value={createData.dimensions.length}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    dimensions: {
                      ...prev.dimensions,
                      length: Number(e.target.value)
                    }
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (cm)
                </label>
                <input
                  type="number"
                  value={createData.dimensions.width}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    dimensions: {
                      ...prev.dimensions,
                      width: Number(e.target.value)
                    }
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={createData.dimensions.height}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    dimensions: {
                      ...prev.dimensions,
                      height: Number(e.target.value)
                    }
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={createData.pickupLocation}
                  onChange={(e) => setCreateData(prev => ({
                    ...prev,
                    pickupLocation: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter pickup location"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 mt-4">
              <button
                onClick={createShipment}
                disabled={creating}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {creating ? 'Creating...' : 'Create Shipment'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Update Status - Show Form */}
        {showStatusUpdate && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Update Shipment Status</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  {shipmentData.nextStatuses?.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Reason for status update"
                />
              </div>

              {/* Waybill Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waybill Number
                </label>
                <input
                  type="text"
                  value={waybillNumber}
                  onChange={(e) => setWaybillNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter waybill number"
                />
              </div>

              {/* Tracking URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking URL
                </label>
                <input
                  type="text"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tracking URL"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 mt-4">
              <button
                onClick={updateShipmentStatus}
                disabled={updating}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => setShowStatusUpdate(false)}
                disabled={updating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentManager;
