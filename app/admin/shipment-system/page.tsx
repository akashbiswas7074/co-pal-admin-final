import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  Database,
  Settings,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function ShipmentSystemPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Package className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Delhivery Shipment Management</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete, production-ready shipment management system with full Delhivery API integration, 
          modern UI components, and comprehensive tracking capabilities.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Badge className="bg-green-100 text-green-800">Production Ready</Badge>
          <Badge className="bg-blue-100 text-blue-800">TypeScript</Badge>
          <Badge className="bg-purple-100 text-purple-800">Modern UI</Badge>
          <Badge className="bg-orange-100 text-orange-800">Full API</Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Zap className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Try Demo</h3>
              <p className="text-gray-600">Experience the full system with demo data</p>
              <Link href="/admin/shipment">
                <Button className="w-full">Launch Demo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Code className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold">API Documentation</h3>
              <p className="text-gray-600">Complete API reference and examples</p>
              <Button variant="outline" className="w-full">View Docs</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Settings className="h-12 w-12 text-purple-600 mx-auto" />
              <h3 className="text-lg font-semibold">Configuration</h3>
              <p className="text-gray-600">Set up Delhivery API and warehouses</p>
              <Button variant="outline" className="w-full">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Backend APIs</p>
                <p className="text-sm text-gray-600">All endpoints functional</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Frontend Components</p>
                <p className="text-sm text-gray-600">Modern React UI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Database Integration</p>
                <p className="text-sm text-gray-600">Order & warehouse models</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium">Delhivery API</p>
                <p className="text-sm text-gray-600">Demo mode active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Shipment Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Forward Shipments (B2C)</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Reverse Shipments (RVP)</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Replacement Shipments (REPL)</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Multi-Package Shipments (MPS)</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Real-time Tracking</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Waybill Generation</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Technical Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>TypeScript Type Safety</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Service Layer Architecture</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Error Handling & Fallbacks</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Modern React Hooks</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Responsive UI Components</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Comprehensive Documentation</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>API Endpoints</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Core Operations</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50">POST</Badge>
                  <code className="text-sm">/api/shipment/create</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50">GET</Badge>
                  <code className="text-sm">/api/shipment/details</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50">GET</Badge>
                  <code className="text-sm">/api/shipment/tracking</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50">POST</Badge>
                  <code className="text-sm">/api/shipment/waybill</code>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Management</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-50">PUT</Badge>
                  <code className="text-sm">/api/shipment/manage</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-red-50">DELETE</Badge>
                  <code className="text-sm">/api/shipment/manage</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50">GET</Badge>
                  <code className="text-sm">/api/warehouse</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50">POST</Badge>
                  <code className="text-sm">/api/warehouse</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>React Components</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">ShipmentManager</h3>
              <p className="text-gray-600">Complete shipment management component with tabs for creation, tracking, and management.</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm">
                  {`<ShipmentManager 
  orderId="order-123"
  onShipmentCreated={handleSuccess}
/>`}
                </code>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">ShipmentDashboard</h3>
              <p className="text-gray-600">Comprehensive dashboard for managing all shipments with filters, search, and analytics.</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm">
                  {`<ShipmentDashboard />`}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Ready to Use:</strong> The system is fully functional in demo mode. 
          To enable live Delhivery integration, add your API credentials to the environment variables and restart the server.
        </AlertDescription>
      </Alert>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">For Development</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Try the demo page</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Integrate with existing orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Test all shipment types</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Customize UI components</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">For Production</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Configure Delhivery API credentials</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Set up warehouse data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Test with real orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Set up monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-2 py-8">
        <p className="text-gray-600">
          Complete Delhivery Shipment Management System - Production Ready
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline">✅ All APIs Implemented</Badge>
          <Badge variant="outline">✅ Modern UI Components</Badge>
          <Badge variant="outline">✅ Full Documentation</Badge>
          <Badge variant="outline">✅ Demo Mode Available</Badge>
        </div>
      </div>
    </div>
  );
}
