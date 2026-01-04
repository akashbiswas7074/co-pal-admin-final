'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  TestTube, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface EnvironmentInfo {
  environment: 'STAGING' | 'PRODUCTION';
  baseUrl: string;
  hasToken: boolean;
  isConfigured: boolean;
  nodeEnv: string;
  testMode: boolean;
}

export default function EnvironmentDashboard() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironmentInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipment/environment');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEnvInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environment info');
      console.error('Error fetching environment info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentInfo();
  }, []);

  const getEnvironmentColor = (environment: string) => {
    return environment === 'STAGING' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  const getEnvironmentIcon = (environment: string) => {
    return environment === 'STAGING' ? <TestTube className="w-4 h-4" /> : <Zap className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading environment information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error loading environment information: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchEnvironmentInfo} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!envInfo) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Delhivery Environment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getEnvironmentColor(envInfo.environment)}>
              {getEnvironmentIcon(envInfo.environment)}
              <span className="ml-1">{envInfo.environment}</span>
            </Badge>
            {envInfo.environment === 'STAGING' && (
              <Badge variant="outline">Safe for Testing</Badge>
            )}
            {envInfo.environment === 'PRODUCTION' && (
              <Badge variant="destructive">Live Environment</Badge>
            )}
          </div>
          <Button 
            onClick={fetchEnvironmentInfo} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Separator />

        {/* Configuration Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Configuration</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Configured</span>
                <div className="flex items-center gap-1">
                  {envInfo.isConfigured ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {envInfo.isConfigured ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Has Token</span>
                <div className="flex items-center gap-1">
                  {envInfo.hasToken ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {envInfo.hasToken ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Environment</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Node Environment</span>
                <Badge variant="outline" className="text-xs">
                  {envInfo.nodeEnv}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Test Mode</span>
                <Badge variant="outline" className="text-xs">
                  {envInfo.testMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* API Endpoint */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">API Endpoint</h4>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <code className="text-sm font-mono text-gray-700">
              {envInfo.baseUrl}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(envInfo.baseUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Environment-specific alerts */}
        {envInfo.environment === 'STAGING' && (
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              You're using the staging environment. This is safe for testing - no real shipments or charges will be created.
            </AlertDescription>
          </Alert>
        )}

        {envInfo.environment === 'PRODUCTION' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're using the production environment. Real shipments will be created and charges will be applied!
            </AlertDescription>
          </Alert>
        )}

        {!envInfo.isConfigured && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Delhivery API is not properly configured. Please check your authentication token in the environment variables.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
