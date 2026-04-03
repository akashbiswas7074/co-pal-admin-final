'use client';

import React from 'react';
import { 
  CheckCircle, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  Truck,
  Activity,
  Info,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface WarehouseDetailsProps {
  warehouseData: {
    warehouseName: string;
    warehouseId: string;
    delhiveryResponse: {
      data: {
        business_hours: {
          [key: string]: {
            start_time: string;
            close_time: string;
          };
        };
        name: string;
        business_days: string[];
        pincode: number;
        type_of_clientwarehouse: string | null;
        phone: string;
        client: string;
        address: string;
        active: boolean;
        message: string;
        largest_vehicle_constraint: string | null;
      };
      success: boolean;
      error: string;
    };
  };
  onClose?: () => void;
}

export const WarehouseDetailsView: React.FC<WarehouseDetailsProps> = ({
  warehouseData,
  onClose
}) => {
  const { delhiveryResponse } = warehouseData;
  const data = delhiveryResponse?.data;

  if (!data) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No warehouse data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (time: string) => {
    return time.replace(':', ':');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Warehouse Created Successfully
            </h1>
            <p className="text-gray-600">
              Your warehouse has been registered with Delhivery production system
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">{data.message}</p>
              <p className="text-green-700 text-sm mt-1">
                Warehouse "{data.name}" is now active and ready for shipments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Warehouse Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{data.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.name)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Client ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-600">{data.client}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.client)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <Badge variant={data.active ? "default" : "secondary"}>
                  <Activity className="h-3 w-3 mr-1" />
                  {data.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Warehouse Type</span>
                <span className="font-medium">
                  {data.type_of_clientwarehouse || "Standard"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contact & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">{data.address}</p>
                  <p className="text-sm text-gray-600">PIN: {data.pincode}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{data.phone}</p>
                  <p className="text-sm text-gray-600">Contact Number</p>
                </div>
              </div>
              
              {data.largest_vehicle_constraint && (
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{data.largest_vehicle_constraint}</p>
                    <p className="text-sm text-gray-600">Vehicle Constraint</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.business_hours && Object.keys(data.business_hours).length > 0 ? (
                Object.entries(data.business_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 w-12">
                      {day}
                    </span>
                    <span className="font-medium">
                      {hours?.start_time && hours?.close_time 
                        ? `${formatTime(hours.start_time)} - ${formatTime(hours.close_time)}`
                        : 'Not specified'
                      }
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No business hours configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Operating Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.business_days && data.business_days.length > 0 ? (
                data.business_days.map((day: string) => (
                  <Badge key={day} variant="outline" className="text-xs">
                    {day}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No operating days configured</p>
              )}
            </div>
            {data.business_days && data.business_days.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Warehouse operates {data.business_days.length} days per week
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Response Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            API Response Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(delhiveryResponse, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🎉 Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Your warehouse is now active and ready for shipments</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>You can now create shipments using this warehouse</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Use the Client ID "{data.client}" for API integrations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Business hours are automatically configured for pickup scheduling</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
