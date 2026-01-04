'use client';

import { useState, useCallback } from 'react';
import type { 
  ShipmentCreateRequest,
  CreateShipmentResponse,
  TrackingInfo,
  ShipmentData
} from '@/types/shipment';

interface UseShipmentOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useShipment(options: UseShipmentOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: string) => {
    setError(error);
    options.onError?.(error);
  }, [options.onError]);

  const handleSuccess = useCallback((data: any) => {
    setError(null);
    options.onSuccess?.(data);
  }, [options.onSuccess]);

  const createShipment = useCallback(async (request: ShipmentCreateRequest): Promise<CreateShipmentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/shipment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      handleSuccess(result.data);
      return result;

    } catch (err: any) {
      handleError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  const getShipmentDetails = useCallback(async (orderId: string): Promise<ShipmentData | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/details?orderId=${orderId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;

    } catch (err: any) {
      handleError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const trackShipment = useCallback(async (waybill: string): Promise<TrackingInfo | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/tracking?waybill=${waybill}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;

    } catch (err: any) {
      handleError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const generateWaybills = useCallback(async (count: number): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/shipment/waybill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.waybills;

    } catch (err: any) {
      handleError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const editShipment = useCallback(async (waybill: string, editData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/shipment/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waybill, editData }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      handleSuccess(result);
      return result;

    } catch (err: any) {
      handleError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  const cancelShipment = useCallback(async (waybill: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipment/manage?waybill=${waybill}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      handleSuccess(result);
      return result;

    } catch (err: any) {
      handleError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createShipment,
    getShipmentDetails,
    trackShipment,
    generateWaybills,
    editShipment,
    cancelShipment,
    clearError
  };
}

export default useShipment;
