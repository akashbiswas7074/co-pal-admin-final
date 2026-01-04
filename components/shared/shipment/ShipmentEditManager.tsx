'use client';

import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Save, 
  X, 
  User, 
  MapPin, 
  Phone, 
  CreditCard,
  Package,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  History
} from 'lucide-react';

interface EditableShipmentData {
  name: string;
  add: string;
  pin: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  payment_mode: 'COD' | 'Prepaid';
  cod_amount: string;
  total_amount: string;
  weight: string;
  shipment_width: string;
  shipment_height: string;
  shipment_length: string;
  shipping_mode: 'Surface' | 'Express';
  products_desc: string;
  quantity: string;
  fragile_shipment: boolean;
  dangerous_good: boolean;
  plastic_packaging: boolean;
}

interface EditHistory {
  editedAt: string;
  editedData: Partial<EditableShipmentData>;
  delhiveryResponse: any;
}

interface ShipmentEditData {
  orderId: string;
  status: string;
  waybillNumbers: string[];
  canEdit: boolean;
  editableStatuses: string[];
  currentData: EditableShipmentData;
  editHistory: EditHistory[];
  lastEditedAt?: string;
}

interface ShipmentEditManagerProps {
  orderId: string;
  waybillNumber?: string;
  onEditComplete?: (data: any) => void;
  className?: string;
}

export const ShipmentEditManager: React.FC<ShipmentEditManagerProps> = ({
  orderId,
  waybillNumber,
  onEditComplete,
  className = ''
}) => {
  const [shipmentData, setShipmentData] = useState<ShipmentEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<string>('');
  
  const [editData, setEditData] = useState<EditableShipmentData | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  // Fetch shipment edit data
  const fetchShipmentEditData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ orderId });
      if (waybillNumber) params.append('waybillNumber', waybillNumber);
      
      const response = await fetch(`/api/shipment/edit?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setShipmentData(result.data);
        setEditData(result.data.currentData);
        setSelectedWaybill(waybillNumber || result.data.waybillNumbers[0] || '');
      } else {
        setError(result.error || 'Failed to fetch shipment edit data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Save edited shipment data
  const saveEditedData = async () => {
    if (!editData || !selectedWaybill || changedFields.size === 0) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Only send changed fields
      const changedData: Partial<EditableShipmentData> = {};
      changedFields.forEach(field => {
        (changedData as any)[field] = (editData as any)[field];
      });

      const response = await fetch('/api/shipment/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          waybillNumber: selectedWaybill,
          editData: changedData
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEditing(false);
        setChangedFields(new Set());
        
        if (onEditComplete) {
          onEditComplete(result.data);
        }
        
        // Refresh data
        await fetchShipmentEditData();
      } else {
        setError(result.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Handle field change
  const handleFieldChange = (field: keyof EditableShipmentData, value: any) => {
    if (!editData || !shipmentData) return;
    
    setEditData({
      ...editData,
      [field]: value
    });
    
    // Track changed fields
    const newChangedFields = new Set(changedFields);
    if (value !== shipmentData.currentData[field]) {
      newChangedFields.add(field);
    } else {
      newChangedFields.delete(field);
    }
    setChangedFields(newChangedFields);
  };

  // Cancel editing
  const cancelEditing = () => {
    if (shipmentData) {
      setEditData(shipmentData.currentData);
      setChangedFields(new Set());
    }
    setEditing(false);
    setError(null);
  };

  useEffect(() => {
    if (orderId) {
      fetchShipmentEditData();
    }
  }, [orderId, waybillNumber]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading shipment edit data...</span>
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
          onClick={fetchShipmentEditData}
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
        No shipment edit data available
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Edit className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Edit Shipment</h3>
          </div>
          <div className="flex items-center space-x-2">
            {shipmentData.canEdit ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Editable
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Not Editable
              </span>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Waybill Selection */}
        {shipmentData.waybillNumbers.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Waybill to Edit
            </label>
            <select
              value={selectedWaybill}
              onChange={(e) => setSelectedWaybill(e.target.value)}
              disabled={editing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {shipmentData.waybillNumbers.map((waybill) => (
                <option key={waybill} value={waybill}>
                  {waybill}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Edit Status Info */}
        {!shipmentData.canEdit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <span className="font-medium text-yellow-800">Editing Not Available</span>
                <p className="text-sm text-yellow-700 mt-1">
                  Current status: <strong>{shipmentData.status}</strong>. 
                  Editing is only allowed for: {shipmentData.editableStatuses.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {shipmentData.canEdit && editData && (
          <>
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mb-6">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Start Editing
                </button>
              ) : (
                <>
                  <button
                    onClick={saveEditedData}
                    disabled={saving || changedFields.size === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : `Save Changes (${changedFields.size})`}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Edit Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="md:col-span-2">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('name') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('phone') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="md:col-span-2">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      value={editData.add}
                      onChange={(e) => handleFieldChange('add', e.target.value)}
                      disabled={!editing}
                      rows={3}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('add') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      value={editData.pin}
                      onChange={(e) => handleFieldChange('pin', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('pin') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('city') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={editData.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('state') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('country') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="md:col-span-2">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={editData.payment_mode}
                      onChange={(e) => handleFieldChange('payment_mode', e.target.value as 'COD' | 'Prepaid')}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('payment_mode') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="COD">Cash on Delivery</option>
                    </select>
                  </div>
                  {editData.payment_mode === 'COD' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        COD Amount
                      </label>
                      <input
                        type="number"
                        value={editData.cod_amount}
                        onChange={(e) => handleFieldChange('cod_amount', e.target.value)}
                        disabled={!editing}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                          changedFields.has('cod_amount') ? 'ring-2 ring-yellow-300' : ''
                        }`}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      value={editData.total_amount}
                      onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('total_amount') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Package Information */}
              <div className="md:col-span-2">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <Package className="h-5 w-5 mr-2" />
                  Package Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Weight className="h-4 w-4 inline mr-1" />
                      Weight (grams)
                    </label>
                    <input
                      type="number"
                      value={editData.weight}
                      onChange={(e) => handleFieldChange('weight', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('weight') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="h-4 w-4 inline mr-1" />
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={editData.shipment_length}
                      onChange={(e) => handleFieldChange('shipment_length', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('shipment_length') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={editData.shipment_width}
                      onChange={(e) => handleFieldChange('shipment_width', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('shipment_width') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={editData.shipment_height}
                      onChange={(e) => handleFieldChange('shipment_height', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('shipment_height') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Mode
                    </label>
                    <select
                      value={editData.shipping_mode}
                      onChange={(e) => handleFieldChange('shipping_mode', e.target.value as 'Surface' | 'Express')}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('shipping_mode') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    >
                      <option value="Surface">Surface</option>
                      <option value="Express">Express</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={editData.quantity}
                      onChange={(e) => handleFieldChange('quantity', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('quantity') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description
                    </label>
                    <input
                      type="text"
                      value={editData.products_desc}
                      onChange={(e) => handleFieldChange('products_desc', e.target.value)}
                      disabled={!editing}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                        changedFields.has('products_desc') ? 'ring-2 ring-yellow-300' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Special Handling */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Handling
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.fragile_shipment}
                        onChange={(e) => handleFieldChange('fragile_shipment', e.target.checked)}
                        disabled={!editing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                      />
                      <span className="ml-2 text-sm text-gray-700">Fragile</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.dangerous_good}
                        onChange={(e) => handleFieldChange('dangerous_good', e.target.checked)}
                        disabled={!editing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                      />
                      <span className="ml-2 text-sm text-gray-700">Dangerous Goods</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.plastic_packaging}
                        onChange={(e) => handleFieldChange('plastic_packaging', e.target.checked)}
                        disabled={!editing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                      />
                      <span className="ml-2 text-sm text-gray-700">Plastic Packaging</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit History */}
        {showHistory && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
              <History className="h-5 w-5 mr-2" />
              Edit History
            </h4>
            {shipmentData.editHistory.length > 0 ? (
              <div className="space-y-3">
                {shipmentData.editHistory.map((edit, index) => (
                  <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Edit #{shipmentData.editHistory.length - index}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(edit.editedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>Changed fields:</strong> {Object.keys(edit.editedData).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No edit history available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentEditManager;
