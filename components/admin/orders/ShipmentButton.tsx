'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Truck, Package, ExternalLink, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  _id: string;
  orderItems?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  user?: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phone: string;
  };
  totalAmount?: number;
  orderStatus: string;
  paymentStatus?: string;
  trackingNumber?: string;
  shipmentStatus?: string;
  shipmentId?: string;
  orderDate?: string;
}

interface ShipmentButtonProps {
  order?: Order;
  orderId?: string;
  orderStatus?: string;
  shipmentCreated?: boolean;
  className?: string;
  onShipmentUpdate?: (orderId: string, shipmentData: any) => void;
}

export function ShipmentButton({
  order,
  orderId,
  orderStatus,
  shipmentCreated,
  className,
  onShipmentUpdate
}: ShipmentButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Use order object if provided, otherwise construct from individual props
  const orderData = order || {
    _id: orderId || '',
    orderStatus: orderStatus || '',
    trackingNumber: shipmentCreated ? 'dummy-tracking' : undefined,
    shipmentStatus: shipmentCreated ? 'shipped' : undefined,
  };

  const getShipmentStatus = () => {
    if (orderData.trackingNumber || shipmentCreated) {
      return { status: 'shipped', label: 'Shipped', color: 'bg-green-500' };
    }
    if (orderData.orderStatus === 'processing') {
      return { status: 'ready', label: 'Ready to Ship', color: 'bg-yellow-500' };
    }
    return { status: 'pending', label: 'Pending', color: 'bg-gray-500' };
  };

  const handleCreateShipment = () => {
    // Navigate to shipment management page with order pre-selected
    router.push(`/admin/dashboard/shipment?orderId=${orderData._id}`);
  };

  const handleCancelShipment = async () => {
    if (!orderData.shipmentId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/shipment/${orderData.shipmentId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Shipment cancelled successfully');
        onShipmentUpdate?.(orderData._id, { status: 'cancelled' });
      } else {
        toast.error(data.message || 'Failed to cancel shipment');
      }
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      toast.error('Failed to cancel shipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackShipment = () => {
    if (orderData.trackingNumber) {
      window.open(`https://track.delhivery.com/track/package/${orderData.trackingNumber}`, '_blank');
    }
  };

  const shipmentStatus = getShipmentStatus();

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Badge variant="secondary" className={`${shipmentStatus.color} text-white`}>
        {shipmentStatus.label}
      </Badge>

      {!orderData.trackingNumber && !shipmentCreated ? (
        <Button
          size="sm"
          onClick={handleCreateShipment}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <Package className="h-4 w-4" />
          {isLoading ? 'Creating...' : 'Create Shipment'}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTrackShipment}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Track
          </Button>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shipment Details</DialogTitle>
                <DialogDescription>
                  Order #{orderData._id.slice(-8)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tracking Number:</span>
                        <p className="text-muted-foreground">{orderData.trackingNumber || 'Not available'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-muted-foreground">{orderData.shipmentStatus || 'In Transit'}</p>
                      </div>
                      {orderData.user?.address && (
                        <div className="col-span-2">
                          <span className="font-medium">Delivery Address:</span>
                          <p className="text-muted-foreground">
                            {orderData.user.address.street}, {orderData.user.address.city},
                            {orderData.user.address.state} {orderData.user.address.zipCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          {orderData.shipmentStatus !== 'delivered' && orderData.shipmentStatus !== 'cancelled' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Shipment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this shipment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelShipment}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
