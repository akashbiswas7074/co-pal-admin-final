'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  Truck,
  Calendar,
  Activity,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface TrackingData {
  waybill: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  scans: Array<{
    location: string;
    status: string;
    instructions: string;
    date: string;
  }>;
}

export default function ShipmentTrackingPage() {
  const { toast } = useToast();
  const [waybillNumber, setWaybillNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackShipment = async () => {
    if (!waybillNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a waybill number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipment/track?waybill=${waybillNumber}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
        toast({
          title: 'Success',
          description: 'Tracking information retrieved successfully',
        });
      } else {
        setError(result.error || 'Failed to track shipment');
        toast({
          title: 'Error',
          description: result.error || 'Failed to track shipment',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      toast({
        title: 'Error',
        description: err.message || 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'pickup scheduled':
      case 'picked up':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in transit':
      case 'dispatched':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'pickup scheduled':
      case 'picked up':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Track Your Shipment
            </h1>
            <p className="text-gray-600">
              Enter your waybill number to get real-time tracking information
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Track Shipment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="waybill">Waybill Number</Label>
                  <Input
                    id="waybill"
                    placeholder="Enter waybill number (e.g., DH123456789)"
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && trackShipment()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={trackShipment} 
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    <span>Track</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-6">
              {/* Shipment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Shipment Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Waybill Number</Label>
                      <p className="font-mono text-lg">{trackingData.waybill}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trackingData.status)}
                        <Badge className={getStatusColor(trackingData.status)}>
                          {trackingData.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Location</Label>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p>{trackingData.currentLocation || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {trackingData.estimatedDelivery && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">
                          Estimated Delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://www.delhivery.com/track/package/${trackingData.waybill}`, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Delhivery</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => trackShipment()}
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Tracking History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingData.scans.length > 0 ? (
                      trackingData.scans.map((scan, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(scan.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{scan.status}</h4>
                              <time className="text-sm text-gray-500">
                                {new Date(scan.date).toLocaleString()}
                              </time>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{scan.instructions}</p>
                            {scan.location && (
                              <div className="flex items-center space-x-1 mt-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{scan.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No tracking history available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 text-sm">
                If you're having trouble tracking your shipment or need additional assistance, 
                please contact our support team or check the Delhivery website directly.
              </p>
              <div className="mt-4 flex space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.delhivery.com/contact', '_blank')}
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.delhivery.com/track', '_blank')}
                >
                  Delhivery Tracking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
