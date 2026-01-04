'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface WaybillManagerProps {
  onWaybillGenerated?: (waybills: string[]) => void;
}

interface Waybill {
  id: string;
  waybillNumber: string;
  status: 'available' | 'reserved' | 'used';
  generatedAt: string;
  usedFor?: string;
  orderId?: string;
}

export default function WaybillManager({ onWaybillGenerated }: WaybillManagerProps) {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [generateCount, setGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock data for demonstration
  const mockWaybills: Waybill[] = [
    {
      id: '1',
      waybillNumber: 'WB001234567890',
      status: 'available',
      generatedAt: '2025-07-04T10:00:00Z'
    },
    {
      id: '2',
      waybillNumber: 'WB001234567891',
      status: 'reserved',
      generatedAt: '2025-07-04T10:00:00Z',
      usedFor: 'order_123'
    },
    {
      id: '3',
      waybillNumber: 'WB001234567892',
      status: 'used',
      generatedAt: '2025-07-04T09:30:00Z',
      usedFor: 'order_122',
      orderId: 'ORD001'
    }
  ];

  const handleGenerateWaybills = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/shipment/waybills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: generateCount
        })
      });

      const data = await response.json();

      if (data.success) {
        const newWaybills = data.waybills.map((waybill: string, index: number) => ({
          id: `new_${Date.now()}_${index}`,
          waybillNumber: waybill,
          status: 'available' as const,
          generatedAt: new Date().toISOString()
        }));

        setWaybills(prev => [...newWaybills, ...prev]);
        setSuccess(`Successfully generated ${data.waybills.length} waybills`);
        
        if (onWaybillGenerated) {
          onWaybillGenerated(data.waybills);
        }
      } else {
        throw new Error(data.error || 'Failed to generate waybills');
      }
    } catch (error: any) {
      console.error('Error generating waybills:', error);
      setError(error.message || 'Failed to generate waybills');
      
      // For demo purposes, generate mock waybills
      const mockNewWaybills = Array.from({ length: generateCount }, (_, index) => ({
        id: `demo_${Date.now()}_${index}`,
        waybillNumber: `DEMO_WB_${Date.now()}_${index}`,
        status: 'available' as const,
        generatedAt: new Date().toISOString()
      }));
      
      setWaybills(prev => [...mockNewWaybills, ...prev]);
      setSuccess(`Generated ${generateCount} demo waybills (API not available)`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadWaybills = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipment/waybills');
      const data = await response.json();

      if (data.success) {
        setWaybills(data.waybills || []);
      } else {
        throw new Error(data.error || 'Failed to load waybills');
      }
    } catch (error: any) {
      console.error('Error loading waybills:', error);
      setError('Failed to load waybills from API, showing demo data');
      setWaybills(mockWaybills);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
      case 'reserved':
        return <Badge variant="secondary">Reserved</Badge>;
      case 'used':
        return <Badge variant="outline">Used</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Waybill Management</h2>
          <p className="text-muted-foreground">Generate and manage waybills for shipments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleLoadWaybills}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Generate Waybills Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Generate New Waybills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="count">Number of Waybills</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="25"
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                placeholder="Enter count (1-25)"
              />
            </div>
            <Button
              onClick={handleGenerateWaybills}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Waybills
                </>
              )}
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Waybills are generated in batches and stored for future use. Pre-generated waybills 
              improve shipment creation speed and are recommended by Delhivery.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Waybills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waybill Inventory</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Available: {waybills.filter(w => w.status === 'available').length}</span>
            <span>Reserved: {waybills.filter(w => w.status === 'reserved').length}</span>
            <span>Used: {waybills.filter(w => w.status === 'used').length}</span>
          </div>
        </CardHeader>
        <CardContent>
          {waybills.length === 0 ? (
            <div className="text-center py-8">
              <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No waybills available</p>
              <p className="text-sm text-muted-foreground">Generate some waybills to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waybill Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Used For</TableHead>
                    <TableHead>Order ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waybills.map((waybill) => (
                    <TableRow key={waybill.id}>
                      <TableCell className="font-mono text-sm">
                        {waybill.waybillNumber}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(waybill.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(waybill.generatedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {waybill.usedFor || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {waybill.orderId || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
