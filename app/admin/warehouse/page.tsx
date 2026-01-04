'use client';

import React, { useState } from 'react';
import { 
  Warehouse, 
  Plus, 
  List,
  Building2,
  MapPin,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseCreation } from '@/components/shared/warehouse/WarehouseCreation';
import { WarehouseList } from '@/components/shared/warehouse/WarehouseList';
import { WarehouseEdit } from '@/components/shared/warehouse/WarehouseEdit';

export default function AdminWarehousePage() {
  const [activeTab, setActiveTab] = useState('create');
  const [warehouseCreated, setWarehouseCreated] = useState<any>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const handleWarehouseCreated = (data: any) => {
    setWarehouseCreated(data);
    // You could also switch to a list view or show success message
  };

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setActiveTab('edit');
  };

  const handleWarehouseUpdated = (data: any) => {
    setEditingWarehouse(null);
    setActiveTab('list');
  };

  const handleCancelEdit = () => {
    setEditingWarehouse(null);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Warehouse className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
              <p className="text-gray-600 mt-1">
                Manage pickup locations for Delhivery shipments
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Warehouses</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cities Covered</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shipments Created</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Warehouse
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Warehouse List
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2" disabled={!editingWarehouse}>
              <Building2 className="h-4 w-4" />
              Edit Warehouse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <WarehouseCreation 
                  onWarehouseCreated={handleWarehouseCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Warehouse List
                </CardTitle>
                <CardDescription>
                  View and manage all registered warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WarehouseList 
                  onEdit={handleEditWarehouse}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            {editingWarehouse && (
              <Card>
                <CardContent className="p-0">
                  <WarehouseEdit 
                    warehouse={editingWarehouse}
                    onWarehouseUpdated={handleWarehouseUpdated}
                    onCancel={handleCancelEdit}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
