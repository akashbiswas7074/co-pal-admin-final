'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WarehouseEditData {
  name: string; // Cannot be changed
  address?: string;
  pin?: string;
  phone?: string;
}

interface WarehouseEditProps {
  warehouse: {
    id: string;
    name: string;
    phone: string;
    address?: string;
    pin: string;
    [key: string]: any;
  };
  onWarehouseUpdated?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const WarehouseEdit: React.FC<WarehouseEditProps> = ({
  warehouse,
  onWarehouseUpdated,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<WarehouseEditData>({
    name: warehouse.name,
    address: warehouse.address || '',
    pin: warehouse.pin || '',
    phone: warehouse.phone || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (field: keyof WarehouseEditData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // Update warehouse
  const updateWarehouse = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Warehouse name is required');
      }

      // Only send fields that have been changed and have values
      const updatePayload: any = {
        name: formData.name
      };

      if (formData.address && formData.address.trim()) {
        updatePayload.address = formData.address.trim();
      }
      if (formData.pin && formData.pin.trim()) {
        updatePayload.pin = formData.pin.trim();
      }
      if (formData.phone && formData.phone.trim()) {
        updatePayload.phone = formData.phone.trim();
      }

      const response = await fetch('/api/warehouse/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Warehouse updated successfully');
        
        if (onWarehouseUpdated) {
          onWarehouseUpdated(result.data);
        }

        // Reset success message after some time
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(result.error || 'Failed to update warehouse');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Edit className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Warehouse</h1>
            <p className="text-gray-600">Update warehouse details in Delhivery system</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Important Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">Update Limitations</h3>
          <p className="text-sm text-amber-700 mt-1">
            • Warehouse name cannot be changed<br/>
            • Only address, pincode, and phone number can be updated<br/>
            • Changes will be synchronized with Delhivery system
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Warehouse Details
          </CardTitle>
          <CardDescription>
            Update the warehouse information below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warehouse Name (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Warehouse Name (Cannot be changed)
            </Label>
            <Input
              id="name"
              value={formData.name}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Warehouse name cannot be modified after creation
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Complete Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete warehouse address"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-sm font-medium">
              Pincode
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="pin"
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value)}
                placeholder="Enter pincode"
                className="pl-10"
                maxLength={6}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter contact number"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={updateWarehouse}
          disabled={loading}
          className="flex items-center gap-2 px-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Updating...' : 'Update Warehouse'}
        </Button>
      </div>
    </div>
  );
};
