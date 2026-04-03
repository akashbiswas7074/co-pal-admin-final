'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  Truck,
  DollarSign,
  Users,
  Globe,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ShipmentAnalytics {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  cancelledShipments: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  totalRevenue: number;
  costSavings: number;
  
  // Time-based data
  dailyShipments: Array<{
    date: string;
    count: number;
    delivered: number;
  }>;
  
  // Location-based data
  locationStats: Array<{
    location: string;
    count: number;
    deliveryRate: number;
  }>;
  
  // Shipment type data
  typeStats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  // Performance metrics
  performanceMetrics: {
    onTimeDelivery: number;
    customerSatisfaction: number;
    returnRate: number;
    damageRate: number;
  };
}

export default function ShipmentAnalyticsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ShipmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('shipments');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipment/analytics?days=${dateRange}`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch analytics',
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

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const exportData = () => {
    if (!analytics) return;

    const data = {
      summary: {
        totalShipments: analytics.totalShipments,
        deliveredShipments: analytics.deliveredShipments,
        deliveryRate: analytics.deliveryRate,
        avgDeliveryTime: analytics.avgDeliveryTime
      },
      dailyShipments: analytics.dailyShipments,
      locationStats: analytics.locationStats,
      typeStats: analytics.typeStats,
      performanceMetrics: analytics.performanceMetrics
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipment-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Analytics data exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shipment Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights into your shipment performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button onClick={fetchAnalytics}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalShipments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.dailyShipments.length > 0 && (
                    <>
                      {analytics.dailyShipments.slice(-7).reduce((sum, day) => sum + day.count, 0)} in last 7 days
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.deliveryRate.toFixed(1)}%</div>
                <Progress value={analytics.deliveryRate} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Delivery Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.avgDeliveryTime.toFixed(1)} days</div>
                <p className="text-xs text-muted-foreground">
                  Industry avg: 4-6 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.inTransitShipments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((analytics.inTransitShipments / analytics.totalShipments) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="types">Types</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipment Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Delivered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{analytics.deliveredShipments}</span>
                          <Badge className="bg-green-100 text-green-800">
                            {((analytics.deliveredShipments / analytics.totalShipments) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>In Transit</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{analytics.inTransitShipments}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {((analytics.inTransitShipments / analytics.totalShipments) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Cancelled</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{analytics.cancelledShipments}</span>
                          <Badge className="bg-red-100 text-red-800">
                            {((analytics.cancelledShipments / analytics.totalShipments) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Total Revenue</span>
                        <span className="font-medium text-green-600">
                          ₹{analytics.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Cost Savings</span>
                        <span className="font-medium text-blue-600">
                          ₹{analytics.costSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Avg. Cost per Shipment</span>
                        <span className="font-medium">
                          ₹{(analytics.totalRevenue / analytics.totalShipments).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Shipment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chart visualization would go here</p>
                      <p className="text-sm text-gray-500">
                        Showing {analytics.dailyShipments.length} days of data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.locationStats.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{location.location}</p>
                            <p className="text-sm text-gray-600">{location.count} shipments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={location.deliveryRate > 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {location.deliveryRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Types Tab */}
            <TabsContent value="types" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.typeStats.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">{type.type}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">{type.count}</span>
                          <Progress value={type.percentage} className="w-20" />
                          <span className="text-sm font-medium">{type.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>On-Time Delivery</span>
                          <span className="font-medium">{analytics.performanceMetrics.onTimeDelivery.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.performanceMetrics.onTimeDelivery} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Customer Satisfaction</span>
                          <span className="font-medium">{analytics.performanceMetrics.customerSatisfaction.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.performanceMetrics.customerSatisfaction} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Return Rate</span>
                          <span className="font-medium">{analytics.performanceMetrics.returnRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.performanceMetrics.returnRate} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Damage Rate</span>
                          <span className="font-medium">{analytics.performanceMetrics.damageRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.performanceMetrics.damageRate} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
