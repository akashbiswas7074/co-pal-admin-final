'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ShipmentManager from './ShipmentManager';

interface ShipmentStats {
  total: number;
  pending: number;
  dispatched: number;
  delivered: number;
  cancelled: number;
}

interface ShipmentDashboardProps {
  selectedOrderId?: string;
}

export default function ShipmentDashboard({ selectedOrderId: propSelectedOrderId }: ShipmentDashboardProps = {}) {
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    pending: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(propSelectedOrderId || null);

  useEffect(() => {
    fetchStats();
  }, []);

  // Update selectedOrderId when prop changes
  useEffect(() => {
    if (propSelectedOrderId) {
      setSelectedOrderId(propSelectedOrderId);
    }
  }, [propSelectedOrderId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/shipment/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch shipment stats: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        const shipmentData = result.data || [];
        
        // Calculate stats
        const stats = shipmentData.reduce((acc: any, shipment: any) => {
          acc.total++;
          switch (shipment.status.toLowerCase()) {
            case 'pending':
            case 'confirmed':
              acc.pending++;
              break;
            case 'dispatched':
            case 'in transit':
              acc.dispatched++;
              break;
            case 'delivered':
            case 'completed':
              acc.delivered++;
              break;
            case 'cancelled':
              acc.cancelled++;
              break;
          }
          return acc;
        }, { total: 0, pending: 0, dispatched: 0, delivered: 0, cancelled: 0 });
        
        setStats(stats);
      } else {
        throw new Error(result.message || 'Failed to fetch shipment stats');
      }
    } catch (err: any) {
      console.error('Error fetching shipment stats:', err);
      setError(err.message || 'Failed to fetch shipment stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Shipment</h1>
          <p className="text-gray-600">Create new shipments for your orders</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispatched</p>
                <p className="text-2xl font-bold text-blue-600">{stats.dispatched}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Shipment Content */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedOrderId ? (
            <ShipmentManager 
              orderId={selectedOrderId}
              onShipmentCreated={() => {
                fetchStats();
              }}
            />
          ) : (
            <div className="space-y-4">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                placeholder="Enter order ID..."
                value={selectedOrderId || ''}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (selectedOrderId) {
                    // Validate order ID exists
                    console.log('Creating shipment for order:', selectedOrderId);
                  }
                }}
                disabled={!selectedOrderId}
              >
                Continue with Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
