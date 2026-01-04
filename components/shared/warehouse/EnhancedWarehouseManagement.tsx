'use client';

import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Settings,
  RotateCcw,
  Database,
  Cloud,
  Activity,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseCreation } from './WarehouseCreation';
import { WarehouseEdit } from './WarehouseEdit';

interface Warehouse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pin: string;
  state?: string;
  country?: string;
  return_address?: string;
  status: 'active' | 'inactive' | 'pending';
  isActive: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
  // Delhivery production fields
  client?: string;
  business_days?: string[];
  business_hours?: any;
  type_of_clientwarehouse?: string;
  largest_vehicle_constraint?: string;
  delhiveryData?: any;
}

interface SyncStatus {
  statistics: {
    total: number;
    active: number;
    pending: number;
    synced: number;
    needsSync: number;
  };
  recentActivity: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface EnhancedWarehouseManagementProps {
  className?: string;
}

export const EnhancedWarehouseManagement: React.FC<EnhancedWarehouseManagementProps> = ({
  className = ''
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [syncing, setSyncing] = useState(false);

  const itemsPerPage = 10;

  // Fetch warehouses from production
  const fetchWarehouses = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/warehouse/list?${params}`);
      const result = await response.json();

      if (result.success) {
        setWarehouses(result.data || []);
        // Update the status message to show production source
        if (result.source === 'delhivery_production') {
          console.log('✅ Fetched warehouses from Delhivery production:', result.message);
        }
      } else {
        setError(result.error || 'Failed to fetch warehouses from production');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while fetching from production');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/warehouse/sync');
      const result = await response.json();

      if (result.success) {
        setSyncStatus(result.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  // Sync warehouses
  const syncWarehouses = async (action: 'sync-from-delhivery' | 'sync-to-delhivery' | 'full-sync') => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/warehouse/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        await fetchWarehouses();
        await fetchSyncStatus();
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSyncing(false);
    }
  };

  // Delete warehouse
  const deleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!confirm(`Are you sure you want to deactivate warehouse "${warehouseName}"?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/warehouse/enhanced/update?id=${warehouseId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Warehouse deactivated successfully');
        await fetchWarehouses();
        await fetchSyncStatus();
      } else {
        setError(result.error || 'Failed to deactivate warehouse');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    }
  };

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.pin.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWarehouses = filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);

  // Effects
  useEffect(() => {
    fetchWarehouses();
    fetchSyncStatus();
  }, [statusFilter]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle warehouse creation
  const handleWarehouseCreated = async (data: any) => {
    await fetchWarehouses();
    await fetchSyncStatus();
    setShowCreateForm(false);
  };

  // Handle warehouse update
  const handleWarehouseUpdated = async (data: any) => {
    await fetchWarehouses();
    await fetchSyncStatus();
    setEditingWarehouse(null);
  };

  // Render create form
  if (showCreateForm) {
    return (
      <WarehouseCreation
        onWarehouseCreated={handleWarehouseCreated}
        onBack={() => setShowCreateForm(false)}
        className={className}
      />
    );
  }

  // Render edit form
  if (editingWarehouse) {
    return (
      <WarehouseEdit
        warehouse={editingWarehouse}
        onWarehouseUpdated={handleWarehouseUpdated}
        onCancel={() => setEditingWarehouse(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Warehouse className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enhanced Warehouse Management
              <span className="ml-2 text-sm font-normal px-2 py-1 bg-green-100 text-green-800 rounded">
                Production Mode
              </span>
            </h1>
            <p className="text-gray-600">Manage pickup locations with live Delhivery production integration</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Warehouse
        </Button>
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

      <Tabs defaultValue="warehouses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="warehouses">
            <Warehouse className="mr-2 h-4 w-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Management
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search warehouses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchWarehouses()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Warehouses List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading warehouses...</span>
            </div>
          ) : paginatedWarehouses.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No warehouses match your current filters.'
                  : 'Get started by creating your first warehouse.'}
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Warehouse
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedWarehouses.map((warehouse) => (
                <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                          <Badge 
                            variant={warehouse.status === 'active' ? 'default' : 
                                   warehouse.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {warehouse.status}
                          </Badge>
                          {warehouse.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Cloud className="h-3 w-3 mr-1" />
                            Production
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Phone:</span> {warehouse.phone}
                          </p>
                          {warehouse.client && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Client ID:</span> 
                              <code className="bg-gray-100 px-1 rounded text-xs">{warehouse.client}</code>
                            </p>
                          )}
                          {warehouse.address && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Address:</span> {warehouse.address}
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Location:</span> 
                            {warehouse.city && `${warehouse.city}, `}{warehouse.pin}
                          </p>
                          {warehouse.email && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Email:</span> {warehouse.email}
                            </p>
                          )}
                          {warehouse.business_days && warehouse.business_days.length > 0 && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Working Days:</span> 
                              <span className="text-xs">{warehouse.business_days.join(', ')}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWarehouse(warehouse)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWarehouse(warehouse.id, warehouse.name)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sync Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Sync Actions
                </CardTitle>
                <CardDescription>
                  Synchronize warehouse data between MongoDB and Delhivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => syncWarehouses('sync-from-delhivery')}
                  disabled={syncing}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Sync from Delhivery
                </Button>
                <Button
                  onClick={() => syncWarehouses('sync-to-delhivery')}
                  disabled={syncing}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Sync to Delhivery
                </Button>
                <Button
                  onClick={() => syncWarehouses('full-sync')}
                  disabled={syncing}
                  className="w-full flex items-center gap-2"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Full Sync
                </Button>
              </CardContent>
            </Card>

            {/* Sync Status */}
            {syncStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sync Status
                  </CardTitle>
                  <CardDescription>
                    Current synchronization status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Warehouses:</span>
                      <span className="font-medium">{syncStatus.statistics.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active:</span>
                      <span className="font-medium text-green-600">{syncStatus.statistics.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending:</span>
                      <span className="font-medium text-yellow-600">{syncStatus.statistics.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Synced:</span>
                      <span className="font-medium text-blue-600">{syncStatus.statistics.synced}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Needs Sync:</span>
                      <span className="font-medium text-red-600">{syncStatus.statistics.needsSync}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Warehouses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {syncStatus?.statistics.total || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Warehouses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {syncStatus?.statistics.active || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sync Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {syncStatus ? Math.round((syncStatus.statistics.synced / syncStatus.statistics.total) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {syncStatus?.recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest warehouse changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncStatus.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-sm text-gray-600">
                          Updated: {new Date(activity.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
