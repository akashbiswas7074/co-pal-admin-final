'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, MapPin, Loader2 } from 'lucide-react';

interface PincodeServiceabilityCheckProps {
  pincode: string;
  onServiceabilityChange?: (serviceable: boolean) => void;
  autoCheck?: boolean;
  className?: string;
}

interface ServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  embargo: boolean;
  remark: string;
  details?: any;
}

export default function PincodeServiceabilityCheck({ 
  pincode, 
  onServiceabilityChange, 
  autoCheck = true,
  className = '' 
}: PincodeServiceabilityCheckProps) {
  const [result, setResult] = useState<ServiceabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check pincode serviceability
  const checkServiceability = async () => {
    if (!pincode || pincode.length !== 6) {
      setError('Invalid pincode format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipment/serviceability?pincode=${pincode}`);
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onServiceabilityChange?.(data.data.serviceable);
      } else {
        setError(data.error || 'Failed to check serviceability');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-check when pincode changes
  useEffect(() => {
    if (autoCheck && pincode && pincode.length === 6) {
      checkServiceability();
    }
  }, [pincode, autoCheck]);

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (result?.embargo) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (result?.serviceable) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return 'Check failed';
    if (result?.embargo) return 'Under embargo';
    if (result?.serviceable) return 'Serviceable';
    return 'Not serviceable';
  };

  const getStatusColor = () => {
    if (loading) return 'bg-gray-100 text-gray-600';
    if (error) return 'bg-red-100 text-red-700';
    if (result?.embargo) return 'bg-yellow-100 text-yellow-700';
    if (result?.serviceable) return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>Pincode Serviceability</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{pincode}</span>
          <Badge className={getStatusColor()}>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
          </Badge>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && !result.serviceable && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>Cannot create shipment:</strong> {result.remark || 'This pincode is not serviceable by Delhivery.'}
            </AlertDescription>
          </Alert>
        )}

        {result && result.embargo && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700">
              <strong>Under embargo:</strong> This pincode is temporarily restricted for shipments.
            </AlertDescription>
          </Alert>
        )}

        {result && result.serviceable && !result.embargo && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              ✅ This pincode is serviceable for delivery.
            </AlertDescription>
          </Alert>
        )}

        {result && result.remark && (
          <div className="text-xs text-gray-600">
            <strong>Details:</strong> {result.remark}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
