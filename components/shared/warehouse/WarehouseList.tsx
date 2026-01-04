'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Warehouse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pin: string;
  country?: string;
  return_address: string;
  return_city?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
  isActive: boolean;
  createdAt: string;
}

interface WarehouseListProps {
  onEdit?: (warehouse: Warehouse) => void;
  className?: string;
}

export const WarehouseList: React.FC<WarehouseListProps> = ({
  onEdit,
  className = ''
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch warehouses
  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/warehouse');
      const result = await response.json();

      if (result.success) {
        setWarehouses(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch warehouses');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleEdit = (warehouse: Warehouse) => {
    if (onEdit) {
      onEdit(warehouse);
    }
  };

  const handleDelete = async (warehouseId: string) => {
    if (!confirm('Are you sure you want to deactivate this warehouse?')) {
      return;
    }

    try {
      const response = await fetch(`/api/warehouse/update?id=${warehouseId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
      } else {
        setError(result.error || 'Failed to deactivate warehouse');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading warehouses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error loading warehouses</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWarehouses}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No warehouses found</h3>
        <p className="text-gray-600 mb-6">
          You haven't registered any warehouses yet. Create your first warehouse to start shipping.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(warehouse)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(warehouse.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{warehouse.phone}</span>
                </div>
                
                {warehouse.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{warehouse.email}</span>
                  </div>
                )}
              </div>

              {/* Address Information */}
              {warehouse.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{warehouse.address}</p>
                    <p className="text-gray-600">
                      {warehouse.city && `${warehouse.city}, `}
                      {warehouse.pin}
                      {warehouse.country && `, ${warehouse.country}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Return Address */}
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-gray-600 mb-1">Return Address:</p>
                <p className="text-sm text-gray-700">{warehouse.return_address}</p>
                {(warehouse.return_city || warehouse.return_pin) && (
                  <p className="text-xs text-gray-600">
                    {warehouse.return_city && `${warehouse.return_city}, `}
                    {warehouse.return_pin}
                    {warehouse.return_state && `, ${warehouse.return_state}`}
                  </p>
                )}
              </div>

              {/* Created Date */}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Created: {new Date(warehouse.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Message */}
      {warehouses.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">
              {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} registered
            </p>
            <p className="text-green-700 text-sm">
              You can now create shipments using {warehouses.length > 1 ? 'these warehouses' : 'this warehouse'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
