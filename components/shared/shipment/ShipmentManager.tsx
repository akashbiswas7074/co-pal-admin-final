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
import type {
  ShipmentDetails,
  ShipmentData,
  ShipmentCreateRequest,
  ShipmentManagerProps,
  WarehouseInfo,
  ShipmentPackage,
  CreateShipmentResponse
} from '@/types/shipment';

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

      {/* No Actions Available */}
      {shipmentData.availableActions.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">No shipment actions available</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            All applicable shipments have been created or the order status doesn't allow new shipments.
          </p>
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
