/**
 * Delhivery API Client
 * Handles all Delhivery API interactions for shipment management
 */

import type { 
  DelhiveryShipmentData, 
  DelhiveryCreatePayload, 
  DelhiveryCreateResponse,
  DelhiveryTrackingResponse,
  DelhiveryWaybillResponse,
  DelhiveryEditPayload,
  DelhiveryEditResponse
} from '@/types/delhivery';

export class DelhiveryAPI {
  private token: string;
  private baseUrl: string;
  
  constructor() {
    this.token = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_AUTH_TOKEN || '';
    this.baseUrl = process.env.DELHIVERY_PRODUCTION_URL || 'https://track.delhivery.com';
    
    // Log configuration status (without exposing the token)
    console.log('[Delhivery API] Configuration:', {
      hasToken: !!this.token,
      tokenLength: this.token ? this.token.length : 0,
      baseUrl: this.baseUrl,
      environment: 'PRODUCTION'
    });
  }

  /**
   * Check if API is configured properly
   */
  isConfigured(): boolean {
    return !!this.token && this.token !== 'your-delhivery-auth-token-here';
  }

  /**
   * Get current environment info
   */
  getEnvironmentInfo() {
    return {
      environment: 'PRODUCTION',
      baseUrl: this.baseUrl,
      hasToken: !!this.token,
      isConfigured: this.isConfigured()
    };
  }

  /**
   * Create a new shipment
   */
  async createShipment(payload: DelhiveryCreatePayload): Promise<DelhiveryCreateResponse> {
    const apiUrl = `${this.baseUrl}/api/cmu/create.json`;
    
    console.log('[Delhivery API] Creating shipment:', {
      url: apiUrl,
      environment: 'PRODUCTION',
      shipmentCount: payload.shipments.length,
      pickupLocation: payload.pickup_location.name
    });

    // Validate payload before sending
    this.validateShipmentPayload(payload);

    // Debug: Log the validated payload
    console.log('[Delhivery API] Validated payload shipments:', payload.shipments.map(s => ({
      order: s.order,
      send_date: s.send_date,
      end_date: s.end_date,
      name: s.name,
      pin: s.pin
    })));

    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify(payload));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] HTTP Error:', response.status, errorText);
      throw new Error(`Delhivery API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Create response:', result);
    
    // Enhanced error handling
    if (!result.success && result.rmk) {
      console.error('[Delhivery API] API returned error:', result.rmk);
      
      // Check for specific error patterns
      if (result.rmk.includes('internal Error')) {
        console.error('[Delhivery API] Internal error detected. This may be due to:');
        console.error('- Invalid pickup location configuration');
        console.error('- Missing required fields in shipment data');
        console.error('- Account configuration issues');
        console.error('- Invalid pincode or address format');
      }
      
      // Log package-level errors if available
      if (result.packages && result.packages.length > 0) {
        result.packages.forEach((pkg: any, index: number) => {
          if (pkg.status === 'Fail' && pkg.remarks) {
            console.error(`[Delhivery API] Package ${index + 1} errors:`, pkg.remarks);
          }
        });
      }
    }
    
    return result;
  }

  /**
   * Generate waybills for MPS shipments
   */
  async generateWaybills(count: number): Promise<string[]> {
    const apiUrl = `${this.baseUrl}/waybill/api/bulk/json/?token=${this.token}&count=${count}`;
    
    console.log('[Delhivery API] Generating waybills:', { 
      count, 
      url: apiUrl,
      environment: 'PRODUCTION'
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery waybill API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Waybill response:', result);
    
    // Delhivery returns waybills in different formats, handle all of them
    if (Array.isArray(result)) {
      return result;
    } else if (result.waybills && Array.isArray(result.waybills)) {
      return result.waybills;
    } else if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (typeof result === 'string') {
      // Handle comma-separated string format
      return result.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    } else if (result.waybills && typeof result.waybills === 'string') {
      // Handle waybills property as comma-separated string
      return result.waybills.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    } else if (result.data && typeof result.data === 'string') {
      // Handle data property as comma-separated string
      return result.data.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    }
    
    return result.waybills || [];
  }

  /**
   * Track shipment by waybill
   */
  async trackShipment(waybill: string): Promise<DelhiveryTrackingResponse> {
    const apiUrl = `${this.baseUrl}/api/v1/packages/json/`;
    
    console.log('[Delhivery API] Tracking shipment:', { waybill });

    const response = await fetch(`${apiUrl}?waybill=${waybill}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery tracking API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Tracking response:', result);
    
    return result;
  }

  /**
   * Edit existing shipment using Delhivery /api/p/edit endpoint
   * Restrictions based on shipment status and payment mode conversions
   */
  async editShipment(payload: DelhiveryEditPayload): Promise<DelhiveryEditResponse> {
    const apiUrl = `${this.baseUrl}/api/p/edit`;
    
    console.log('[Delhivery API] Edit shipment:', {
      waybill: payload.waybill,
      fields: Object.keys(payload).filter(key => key !== 'waybill'),
      url: apiUrl
    });

    // First, get current shipment status to validate edit permissions
    const trackingData = await this.trackShipment(payload.waybill);
    const currentStatus = this.getCurrentShipmentStatus(trackingData);
    const currentPaymentMode = this.getCurrentPaymentMode(trackingData);

    // Validate edit restrictions
    this.validateEditRestrictions(currentStatus, currentPaymentMode, payload);

    // Prepare the edit payload according to Delhivery API specs
    const editData = this.prepareEditPayload(payload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] Edit error:', response.status, errorText);
      throw new Error(`Delhivery edit API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Edit response:', result);
    
    return result;
  }

  /**
   * Get current shipment status from tracking data
   */
  private getCurrentShipmentStatus(trackingData: DelhiveryTrackingResponse): string {
    if (trackingData.ShipmentTrack && trackingData.ShipmentTrack.length > 0) {
      const shipment = trackingData.ShipmentTrack[0];
      if (shipment.Shipment && shipment.Shipment.Status) {
        return shipment.Shipment.Status.Status;
      }
    }
    return 'Unknown';
  }

  /**
   * Get current payment mode from tracking data
   * Note: Payment mode detection from tracking is limited, we'll need to rely on our database
   */
  private getCurrentPaymentMode(trackingData: DelhiveryTrackingResponse): string {
    // Since CODAmount is not available in tracking response, 
    // we'll return 'Unknown' and rely on database validation
    return 'Unknown';
  }

  /**
   * Validate edit restrictions based on Delhivery policies
   */
  private validateEditRestrictions(
    currentStatus: string, 
    currentPaymentMode: string, 
    payload: DelhiveryEditPayload
  ): void {
    // Define allowed statuses for editing
    const allowedEditStatuses = [
      'PENDING',
      'PICKUP_PENDING',
      'PICKUP_SCHEDULED',
      'MANIFEST_GENERATED'
    ];

    // Check if current status allows editing
    if (!allowedEditStatuses.includes(currentStatus)) {
      throw new Error(`Shipment cannot be edited in current status: ${currentStatus}. 
        Editing is only allowed for: ${allowedEditStatuses.join(', ')}`);
    }

    // Validate payment mode conversions
    if (payload.payment_mode && payload.payment_mode !== currentPaymentMode) {
      this.validatePaymentModeConversion(currentPaymentMode, payload.payment_mode);
    }

    // Validate specific field restrictions
    if (payload.cod_amount !== undefined) {
      if (payload.payment_mode === 'Prepaid' && parseFloat(payload.cod_amount) > 0) {
        throw new Error('COD amount must be 0 for Prepaid shipments');
      }
      if (payload.payment_mode === 'COD' && parseFloat(payload.cod_amount) <= 0) {
        throw new Error('COD amount must be greater than 0 for COD shipments');
      }
    }

    // Validate weight restrictions (if current status doesn't allow weight changes)
    const weightRestrictedStatuses = ['MANIFEST_GENERATED', 'PICKUP_SCHEDULED'];
    if (weightRestrictedStatuses.includes(currentStatus) && payload.weight) {
      throw new Error(`Weight cannot be modified in status: ${currentStatus}`);
    }
  }

  /**
   * Validate payment mode conversion rules
   */
  private validatePaymentModeConversion(from: string, to: string): void {
    const allowedConversions: Record<string, string[]> = {
      'COD': ['Prepaid'], // COD can be converted to Prepaid
      'Prepaid': [], // Prepaid cannot be converted to COD (in most cases)
      'Pickup': ['COD', 'Prepaid'], // Pickup can be converted to either
      'REPL': [] // REPL typically cannot be converted
    };

    const allowed = allowedConversions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Payment mode conversion from ${from} to ${to} is not allowed. 
        Allowed conversions from ${from}: ${allowed.length > 0 ? allowed.join(', ') : 'None'}`);
    }
  }

  /**
   * Prepare edit payload according to Delhivery API specifications
   */
  private prepareEditPayload(payload: DelhiveryEditPayload): any {
    const editData: any = {
      waybill: payload.waybill
    };

    // Only include allowed fields based on Delhivery documentation
    const allowedFields = [
      'name', 'add', 'pin', 'city', 'state', 'phone',
      'payment_mode', 'cod_amount', 'weight',
      'shipment_width', 'shipment_height', 'shipment_length',
      'products_desc', 'seller_name', 'seller_add',
      'return_name', 'return_add', 'return_city', 'return_phone',
      'return_pin', 'return_state', 'return_country'
    ];

    allowedFields.forEach(field => {
      if (payload[field as keyof DelhiveryEditPayload] !== undefined) {
        editData[field] = payload[field as keyof DelhiveryEditPayload];
      }
    });

    // Ensure string values for numeric fields that Delhivery expects as strings
    if (editData.cod_amount !== undefined) {
      editData.cod_amount = String(editData.cod_amount);
    }
    if (editData.weight !== undefined) {
      editData.weight = String(editData.weight);
    }
    if (editData.shipment_width !== undefined) {
      editData.shipment_width = String(editData.shipment_width);
    }
    if (editData.shipment_height !== undefined) {
      editData.shipment_height = String(editData.shipment_height);
    }
    if (editData.shipment_length !== undefined) {
      editData.shipment_length = String(editData.shipment_length);
    }

    return editData;
  }

  /**
   * Check pin code serviceability
   */
  async checkServiceability(pincode: string): Promise<boolean> {
    const apiUrl = `${this.baseUrl}/c/api/pin-codes/json/`;
    
    console.log('[Delhivery API] Checking serviceability:', { pincode });

    const response = await fetch(`${apiUrl}?filter_codes=${pincode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn(`[Delhivery API] Serviceability check failed: ${response.status}`);
      return true; // Default to serviceable if check fails
    }

    const result = await response.json();
    console.log('[Delhivery API] Serviceability response:', result);
    
    return result.delivery_codes?.length > 0;
  }

  /**
   * Cancel shipment using the correct Delhivery API endpoint
   */
  async cancelShipment(waybill: string): Promise<boolean> {
    const apiUrl = `${this.baseUrl}/api/p/edit`;
    
    console.log('[Delhivery API] Cancelling shipment:', { waybill });

    const requestBody = {
      waybill: waybill,
      cancellation: "true"
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      // Handle specific error cases
      if (response.status === 404) {
        console.warn('[Delhivery API] Waybill not found for cancellation:', waybill);
        throw new Error(`Shipment with waybill ${waybill} not found on Delhivery`);
      }
      
      // Check if the error is an HTML page (like login page or error page)
      if (errorText && (errorText.includes('<!doctype html>') || errorText.includes('<html') || errorText.includes('<HTML'))) {
        console.warn('[Delhivery API] Received HTML response instead of JSON:', response.status);
        
        if (response.status === 404) {
          throw new Error(`Shipment with waybill ${waybill} not found on Delhivery`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed with Delhivery API. Please check your API token.');
        } else {
          throw new Error(`Delhivery API returned an error page (${response.status}). Please try again later.`);
        }
      }
      
      // Try to parse JSON error response
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (e) {
        // Not JSON, continue with generic error
      }
      
      throw new Error(`Delhivery cancel API error: ${response.status} - Failed to cancel shipment`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Cancel response:', result);
    
    // Check if cancellation was successful - Delhivery returns various success indicators
    if (result.success === true || 
        result.status === 'success' || 
        result.message?.toLowerCase().includes('cancelled') ||
        result.message?.toLowerCase().includes('canceled') ||
        result.message?.toLowerCase().includes('success') ||
        (result.packages && result.packages.length > 0 && result.packages[0].status === 'Success') ||
        (result.rmk && result.rmk.toLowerCase().includes('success')) ||
        // If no explicit error and HTTP 200, consider it successful
        (!result.error && !result.message?.toLowerCase().includes('error') && !result.message?.toLowerCase().includes('fail'))) {
      return true;
    }
    
    // Handle Delhivery-specific error responses
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.message && (result.message.toLowerCase().includes('error') || result.message.toLowerCase().includes('fail'))) {
      throw new Error(result.message);
    }
    
    // If we get here and there's no explicit error, log the response and consider it successful
    console.log('[Delhivery API] Unclear cancellation response, considering successful:', result);
    return true;
  }

  /**
   * Fetch bulk waybills (up to 10,000 at once)
   * Uses the correct Delhivery API endpoints for production and staging
   */
  async fetchBulkWaybills(count: number): Promise<string[]> {
    if (count > 10000) {
      throw new Error('Cannot fetch more than 10,000 waybills at once');
    }

    // Use production waybill endpoint
    const waybillUrl = 'https://track.delhivery.com/waybill/api/bulk/json/';
    
    const apiUrl = `${waybillUrl}?token=${this.token}&count=${count}`;
    
    console.log('[Delhivery API] Fetching bulk waybills:', { 
      count, 
      url: apiUrl, 
      environment: 'PRODUCTION' 
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery waybill API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Bulk waybills response:', result);
    
    // Delhivery returns waybills in different formats, handle all of them
    if (Array.isArray(result)) {
      return result;
    } else if (result.waybills && Array.isArray(result.waybills)) {
      return result.waybills;
    } else if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (typeof result === 'string') {
      // Handle comma-separated string format
      return result.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    } else if (result.waybills && typeof result.waybills === 'string') {
      // Handle waybills property as comma-separated string
      return result.waybills.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    } else if (result.data && typeof result.data === 'string') {
      // Handle data property as comma-separated string
      return result.data.split(',').map((w: string) => w.trim()).filter((w: string) => w);
    }
    
    throw new Error('Unexpected waybill response format');
  }

  /**
   * Fetch single waybill
   * Uses the correct Delhivery API endpoints for production and staging
   */
  async fetchSingleWaybill(): Promise<string> {
    // Use production waybill endpoint
    const waybillUrl = 'https://track.delhivery.com/waybill/api/fetch/json/';
    
    const apiUrl = `${waybillUrl}?token=${this.token}`;
    
    console.log('[Delhivery API] Fetching single waybill:', { 
      url: apiUrl, 
      environment: 'PRODUCTION' 
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery waybill API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Single waybill response:', result);
    
    // Extract waybill from response - handle different formats
    if (typeof result === 'string') {
      // Handle direct string response
      return result.trim();
    } else if (result.waybill) {
      // Handle object with waybill property
      return typeof result.waybill === 'string' ? result.waybill.trim() : result.waybill;
    } else if (result.data) {
      // Handle object with data property
      return typeof result.data === 'string' ? result.data.trim() : result.data;
    } else if (Array.isArray(result) && result.length > 0) {
      // Handle array response, take first waybill
      return result[0];
    }
    
    throw new Error('Unexpected waybill response format');
  }

  /**
   * Check pincode serviceability
   */
  async checkPincodeServiceability(pincode: string): Promise<{
    serviceable: boolean;
    embargo: boolean;
    remark: string;
    details?: any;
  }> {
    // Production API endpoint
    const apiUrl = `${this.baseUrl}/c/api/pin-codes/json/?filter_codes=${pincode}`;
    
    console.log('[Delhivery API] Checking pincode serviceability:', { 
      pincode, 
      url: apiUrl,
      hasToken: !!this.token,
      tokenLength: this.token ? this.token.length : 0,
      environment: 'PRODUCTION'
    });

    if (!this.token) {
      console.error('[Delhivery API] No authentication token found');
      throw new Error('Delhivery API token not configured');
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] Pincode API error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorText,
        environment: 'PRODUCTION'
      });
      
      if (response.status === 401) {
        throw new Error('Delhivery API authentication failed. Please check your API token.');
      }
      
      throw new Error(`Delhivery pincode API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Pincode serviceability response:', result);
    
    // If empty list, pincode is non-serviceable
    if (Array.isArray(result) && result.length === 0) {
      return {
        serviceable: false,
        embargo: false,
        remark: 'Non-serviceable zone (NSZ)',
        details: result
      };
    }

    // Check first result for serviceability
    const pincodeData = Array.isArray(result) ? result[0] : result;
    const isEmbargo = pincodeData?.remark === 'Embargo';
    
    return {
      serviceable: !isEmbargo && !!pincodeData,
      embargo: isEmbargo,
      remark: pincodeData?.remark || '',
      details: pincodeData
    };
  }

  /**
   * Check heavy product pincode serviceability
   */
  async checkHeavyPincodeServiceability(pincode: string): Promise<{
    serviceable: boolean;
    paymentTypes: string[];
    details?: any;
  }> {
    const apiUrl = `${this.baseUrl}/api/dc/fetch/serviceability/pincode?product_type=Heavy&pincode=${pincode}`;
    
    console.log('[Delhivery API] Checking heavy pincode serviceability:', { pincode, url: apiUrl });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery heavy pincode API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Heavy pincode serviceability response:', result);
    
    // Handle NSZ response
    if (result.message === 'NSZ' || result.status === 'NSZ') {
      return {
        serviceable: false,
        paymentTypes: [],
        details: result
      };
    }

    // Extract payment types
    const paymentTypes = [];
    if (result.payment_type) {
      if (Array.isArray(result.payment_type)) {
        paymentTypes.push(...result.payment_type);
      } else {
        paymentTypes.push(result.payment_type);
      }
    }
    
    return {
      serviceable: paymentTypes.length > 0,
      paymentTypes,
      details: result
    };
  }

  /**
   * Fetch warehouses from Delhivery API
   */
  async fetchWarehouses(): Promise<any[]> {
    // Try the most likely endpoints first
    const warehouseEndpoints = [
      '/api/backend/clientwarehouse/',
      '/api/backend/clientwarehouse/list/',
      '/api/backend/clientwarehouse/get/',
      '/api/backend/warehouse/',
      '/api/backend/warehouse/list/',
      '/api/cmu/warehouse/',
      '/api/warehouse/',
      '/api/v1/warehouse/',
      '/warehouse/api/list/',
      '/api/pickup/warehouse/',
      '/api/pickup/location/',
      '/api/pickup/locations/'
    ];
    
    for (const endpoint of warehouseEndpoints) {
      const apiUrl = `${this.baseUrl}${endpoint}`;
      
      try {
        console.log(`[Delhivery API] Trying warehouse endpoint: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${this.token}`,
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[Delhivery API] Successfully fetched warehouses from ${endpoint}:`, result);
          
          // Handle different response formats
          if (Array.isArray(result)) {
            return result;
          } else if (result.data && Array.isArray(result.data)) {
            return result.data;
          } else if (result.warehouses && Array.isArray(result.warehouses)) {
            return result.warehouses;
          } else if (result.results && Array.isArray(result.results)) {
            return result.results;
          } else if (result.pickup_locations && Array.isArray(result.pickup_locations)) {
            return result.pickup_locations;
          }
        } else if (response.status === 404) {
          console.log(`[Delhivery API] Endpoint ${endpoint} not found, trying next`);
          continue;
        } else {
          const errorText = await response.text();
          console.log(`[Delhivery API] Endpoint ${endpoint} returned error:`, response.status, errorText.substring(0, 200));
          continue;
        }
      } catch (error) {
        console.log(`[Delhivery API] Error with endpoint ${endpoint}:`, error);
        continue;
      }
    }
    
    console.log('[Delhivery API] No warehouse endpoint worked, returning default warehouses');
    
    // Return default warehouses if API doesn't work
    return [
      {
        name: 'Main Warehouse',
        warehouse_name: 'Main Warehouse',
        address: 'Main Warehouse Address',
        warehouse_address: 'Main Warehouse Address',
        pin: '400001',
        pincode: '400001',
        warehouse_pin: '400001',
        phone: '+919876543210',
        warehouse_phone: '+919876543210',
        city: 'Mumbai',
        warehouse_city: 'Mumbai',
        state: 'Maharashtra',
        warehouse_state: 'Maharashtra',
        active: true,
        status: 'active'
      },
      {
        name: 'Delhi Hub',
        warehouse_name: 'Delhi Hub',
        address: 'Delhi Hub Address',
        warehouse_address: 'Delhi Hub Address',
        pin: '110001',
        pincode: '110001',
        warehouse_pin: '110001',
        phone: '+919876543211',
        warehouse_phone: '+919876543211',
        city: 'Delhi',
        warehouse_city: 'Delhi',
        state: 'Delhi',
        warehouse_state: 'Delhi',
        active: true,
        status: 'active'
      }
    ];
  }

  /**
   * Update existing warehouse
   */
  async updateWarehouse(warehouseData: {
    name: string;
    address?: string;
    pin?: string;
    phone?: string;
  }): Promise<any> {
    const apiUrl = `${this.baseUrl}/api/backend/clientwarehouse/edit/`;
    
    console.log('[Delhivery API] Updating warehouse:', { name: warehouseData.name, url: apiUrl });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warehouseData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery warehouse update API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Warehouse update response:', result);
    
    return result;
  }

  /**
   * Get API configuration status
   */
  getStatus(): { configured: boolean; baseUrl: string; hasToken: boolean } {
    return {
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      hasToken: !!this.token
    };
  }

  /**
   * Get waybill API rate limiting information
   */
  getWaybillRateLimits(): {
    bulkWaybill: {
      maxPerRequest: number;
      maxPer5Minutes: number;
      throttleTime: string;
    };
    singleWaybill: {
      maxPer5Minutes: number;
    };
  } {
    return {
      bulkWaybill: {
        maxPerRequest: 10000,
        maxPer5Minutes: 50000,
        throttleTime: '1 minute'
      },
      singleWaybill: {
        maxPer5Minutes: 750
      }
    };
  }

  /**
   * Generate waybills with automatic fallback to single waybill API
   * This method handles the rate limiting and batching logic
   */
  async generateWaybillsWithFallback(count: number): Promise<string[]> {
    try {
      // For single waybill, use the single waybill API
      if (count === 1) {
        const waybill = await this.fetchSingleWaybill();
        return [waybill];
      }

      // For bulk waybills, use the bulk API
      if (count <= 10000) {
        return await this.fetchBulkWaybills(count);
      }

      // For very large counts, batch them
      const waybills: string[] = [];
      const batchSize = 10000;
      const batches = Math.ceil(count / batchSize);

      for (let i = 0; i < batches; i++) {
        const currentBatchSize = Math.min(batchSize, count - (i * batchSize));
        const batchWaybills = await this.fetchBulkWaybills(currentBatchSize);
        waybills.push(...batchWaybills);

        // Add delay between batches to respect rate limits
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return waybills;
    } catch (error) {
      console.error('[Delhivery API] Error generating waybills:', error);
      throw error;
    }
  }

  /**
   * Create a pickup request for shipments
   */
  async createPickupRequest(pickupData: {
    pickup_time: string;
    pickup_date: string;
    pickup_location: string;
    expected_package_count: number;
  }): Promise<any> {
    const apiUrl = `${this.baseUrl}/fm/request/new/`;
    
    console.log('[Delhivery API] Creating pickup request:', {
      url: apiUrl,
      environment: 'PRODUCTION',
      pickupData
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pickupData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] Pickup request error:', response.status, errorText);
      throw new Error(`Delhivery pickup request error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Pickup request response:', result);
    
    return result;
  }

  /**
   * Validate shipment payload before sending to API
   */
  private validateShipmentPayload(payload: DelhiveryCreatePayload): void {
    if (!payload.shipments || payload.shipments.length === 0) {
      throw new Error('At least one shipment is required');
    }

    payload.shipments.forEach((shipment: any, index: number) => {
      if (!shipment.name) {
        throw new Error(`Shipment ${index + 1}: Customer name is required`);
      }
      if (!shipment.add) {
        throw new Error(`Shipment ${index + 1}: Customer address is required`);
      }
      if (!shipment.pin) {
        throw new Error(`Shipment ${index + 1}: Customer pincode is required`);
      }
      if (!shipment.phone) {
        throw new Error(`Shipment ${index + 1}: Customer phone is required`);
      }
      if (!shipment.order) {
        throw new Error(`Shipment ${index + 1}: Order ID is required`);
      }
      if (!shipment.payment_mode) {
        throw new Error(`Shipment ${index + 1}: Payment mode is required`);
      }
      if (!shipment.return_name || !shipment.return_add || !shipment.return_pin) {
        throw new Error(`Shipment ${index + 1}: Return address details are required`);
      }
      
      // CRITICAL: Ensure send_date is present - this prevents the NoneType error
      if (!shipment.send_date) {
        shipment.send_date = new Date().toISOString().split('T')[0];
        console.log(`[Delhivery API] Added missing send_date to shipment ${index + 1}: ${shipment.send_date}`);
      }
      
      // CRITICAL: Ensure end_date is present - this prevents the NoneType error
      if (!shipment.end_date) {
        shipment.end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log(`[Delhivery API] Added missing end_date to shipment ${index + 1}: ${shipment.end_date}`);
      }
      
      // Validate pincode format
      if (!/^\d{6}$/.test(shipment.pin)) {
        console.warn(`[Delhivery API] Invalid pincode format for shipment ${index + 1}: ${shipment.pin}`);
      }
      
      // Validate phone number format
      if (!/^\d{10}$/.test(shipment.phone.replace(/\D/g, ''))) {
        console.warn(`[Delhivery API] Invalid phone format for shipment ${index + 1}: ${shipment.phone}`);
      }
    });

    if (!payload.pickup_location || !payload.pickup_location.name) {
      throw new Error('Pickup location is required');
    }
  }

  /**
   * Format phone number to valid Indian format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.length === 10) {
      return digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      return digits.substring(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return digits.substring(2);
    } else if (digits.length === 13 && digits.startsWith('+91')) {
      return digits.substring(3);
    }
    
    // Default fallback
    return '9999999999';
  }

  /**
   * Update E-waybill for shipment
   * Required for shipments with value > 50k as per Indian government laws
   */
  async updateEwaybill(waybill: string, data: {
    dcn: string;  // Invoice number
    ewbn: string; // E-waybill number
  }): Promise<any> {
    const apiUrl = `${this.baseUrl}/api/rest/ewaybill/${waybill}/`;
    
    console.log('[Delhivery API] Updating E-waybill:', {
      waybill,
      url: apiUrl,
      environment: 'PRODUCTION'
    });

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: [data]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] E-waybill update error:', response.status, errorText);
      throw new Error(`Delhivery E-waybill update API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] E-waybill update response:', result);
    
    return result;
  }

  /**
   * Track shipment with enhanced features
   * Supports tracking up to 50 waybills in a single request
   */
  async trackShipmentEnhanced(waybills: string | string[], orderIds?: string[]): Promise<DelhiveryTrackingResponse> {
    const apiUrl = `${this.baseUrl}/api/v1/packages/json/`;
    
    // Handle both single waybill and multiple waybills
    const waybillParam = Array.isArray(waybills) ? waybills.join(',') : waybills;
    const orderIdsParam = orderIds ? orderIds.join(',') : '';
    
    const params = new URLSearchParams();
    params.append('waybill', waybillParam);
    if (orderIdsParam) {
      params.append('ref_ids', orderIdsParam);
    }
    
    console.log('[Delhivery API] Tracking shipment (enhanced):', { 
      waybills: waybillParam,
      orderIds: orderIdsParam,
      url: `${apiUrl}?${params.toString()}`,
      environment: 'PRODUCTION'
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery tracking API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Enhanced tracking response:', result);
    
    return result;
  }

  /**
   * Create shipment with automatic waybill generation
   * This method handles waybill generation and shipment creation in one flow
   */
  async createShipmentWithAutoWaybill(payload: DelhiveryCreatePayload): Promise<{
    shipmentResult: DelhiveryCreateResponse;
    waybills: string[];
    success: boolean;
  }> {
    console.log('[Delhivery API] Creating shipment with auto-waybill generation');
    
    try {
      // Step 1: Generate waybills for the shipments
      const waybillCount = payload.shipments.length;
      const waybills = await this.generateWaybillsWithFallback(waybillCount);
      
      if (waybills.length < waybillCount) {
        throw new Error(`Not enough waybills generated. Required: ${waybillCount}, Generated: ${waybills.length}`);
      }
      
      // Step 2: Assign waybills to shipments
      payload.shipments.forEach((shipment: any, index: number) => {
        shipment.waybill = waybills[index];
        console.log(`[Delhivery API] Assigned waybill ${waybills[index]} to shipment ${shipment.order}`);
      });
      
      // Step 3: Create shipments with assigned waybills
      const shipmentResult = await this.createShipment(payload);
      
      return {
        shipmentResult,
        waybills: waybills.slice(0, waybillCount),
        success: true
      };
      
    } catch (error) {
      console.error('[Delhivery API] Error in auto-waybill shipment creation:', error);
      throw error;
    }
  }

  /**
   * Bulk waybill generation with automatic storage
   * Generates waybills and can store them for later use
   */
  async generateAndStoreWaybills(count: number, storeFunction?: (waybills: string[]) => Promise<void>): Promise<string[]> {
    console.log('[Delhivery API] Generating and storing waybills:', { count });
    
    try {
      const waybills = await this.generateWaybillsWithFallback(count);
      
      if (storeFunction) {
        await storeFunction(waybills);
        console.log('[Delhivery API] Waybills stored successfully');
      }
      
      return waybills;
    } catch (error) {
      console.error('[Delhivery API] Error in waybill generation and storage:', error);
      throw error;
    }
  }

  /**
   * Get shipment label/invoice data
   * Useful for printing shipping labels
   */
  async getShipmentLabel(waybill: string): Promise<any> {
    const apiUrl = `${this.baseUrl}/api/p/packing_slip`;
    
    console.log('[Delhivery API] Fetching shipment label:', { 
      waybill,
      url: apiUrl,
      environment: 'PRODUCTION'
    });

    const response = await fetch(`${apiUrl}?waybill=${waybill}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery label API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Delhivery API] Shipment label response:', result);
    
    return result;
  }

  /**
   * Get comprehensive shipment status
   * Provides detailed status information for better order management
   */
  async getShipmentStatus(waybill: string): Promise<{
    status: string;
    statusCode: string;
    location: string;
    timestamp: string;
    remarks: string;
    isDelivered: boolean;
    isInTransit: boolean;
    isPickedUp: boolean;
    estimatedDelivery?: string;
  }> {
    const trackingData = await this.trackShipment(waybill);
    
    // Extract status information from tracking data
    const scans = (trackingData as any).scans || [];
    const latestScan = scans.length > 0 ? scans[0] : null;
    
    return {
      status: latestScan?.status || 'Unknown',
      statusCode: latestScan?.status_code || '',
      location: latestScan?.location || '',
      timestamp: latestScan?.timestamp || '',
      remarks: latestScan?.remarks || '',
      isDelivered: latestScan?.status?.toLowerCase().includes('delivered') || false,
      isInTransit: latestScan?.status?.toLowerCase().includes('in transit') || false,
      isPickedUp: latestScan?.status?.toLowerCase().includes('picked') || false,
      estimatedDelivery: (trackingData as any).estimated_delivery_date
    };
  }

  /**
   * Validate shipment before creation
   * Comprehensive validation to prevent API errors
   */
  async validateShipmentBeforeCreation(payload: DelhiveryCreatePayload): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Basic payload validation
      this.validateShipmentPayload(payload);
      
      // Check serviceability for each shipment
      for (const shipment of payload.shipments) {
        const serviceabilityResult = await this.checkPincodeServiceability(shipment.pin);
        
        if (!serviceabilityResult.serviceable) {
          errors.push(`Pincode ${shipment.pin} is not serviceable: ${serviceabilityResult.remark}`);
        }
        
        if (serviceabilityResult.embargo) {
          warnings.push(`Pincode ${shipment.pin} is under embargo`);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings
      };
    }
  }

  /**
   * ORDER MANAGEMENT AND FETCHING FUNCTIONALITY
   * Comprehensive order fetching, filtering, and management
   */

  /**
   * Fetch all orders with filtering and pagination
   */
  async fetchOrders(options: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    status?: string;
    waybill?: string;
    referenceNumber?: string;
    state?: string;
    city?: string;
    destination?: string;
    origin?: string;
    orderType?: string;
    paymentMode?: string;
    sortBy?: 'date' | 'status' | 'amount' | 'waybill';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    orders: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    summary: {
      totalOrders: number;
      pendingOrders: number;
      inTransitOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalAmount: number;
      totalCodAmount: number;
      totalPrepaidAmount: number;
    };
  }> {
    const {
      page = 1,
      limit = 50,
      fromDate,
      toDate,
      status,
      waybill,
      referenceNumber,
      state,
      city,
      destination,
      origin,
      orderType,
      paymentMode,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    // Use the packages API endpoint for fetching shipment data
    const apiUrl = `${this.baseUrl}/api/v1/packages/json/`;
    
    console.log('[Delhivery API] Fetching orders with filters:', {
      url: apiUrl,
      environment: 'PRODUCTION',
      filters: options
    });

    // Build query parameters for packages API
    const queryParams = new URLSearchParams();
    
    // For packages API, we need to use different parameter names
    if (waybill) queryParams.append('waybill', waybill);
    if (referenceNumber) queryParams.append('ref_ids', referenceNumber);
    
    // Note: The packages API doesn't support all the filtering options
    // that were being used with the warehouse API. We'll need to implement
    // client-side filtering for some parameters or use different endpoints
    
    // For now, if no specific waybill is provided, we'll return empty results
    // as the packages API requires at least a waybill or reference ID
    if (!waybill && !referenceNumber) {
      console.log('[Delhivery API] No waybill or reference number provided, returning empty results');
      return {
        orders: [],
        summary: {
          totalOrders: 0,
          pendingOrders: 0,
          inTransitOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalAmount: 0,
          totalCodAmount: 0,
          totalPrepaidAmount: 0
        },
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }

    try {
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Delhivery API] Orders fetch error:', response.status, errorText);
        
        // Return empty result instead of throwing error
        return {
          orders: [],
          summary: {
            totalOrders: 0,
            pendingOrders: 0,
            inTransitOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalAmount: 0,
            totalCodAmount: 0,
            totalPrepaidAmount: 0
          },
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        };
      }

      const result = await response.json();
      
      // The packages API returns data in ShipmentData format
      let orders = [];
      if (result.ShipmentData && Array.isArray(result.ShipmentData)) {
        orders = result.ShipmentData.map((item: any) => item.Shipment).filter(Boolean);
      } else if (result.data && Array.isArray(result.data)) {
        orders = result.data;
      } else if (Array.isArray(result)) {
        orders = result;
      }
      
      // Process and enhance order data
      const enhancedOrders = await this.enhanceOrderData(orders);
      
      // Calculate summary statistics
      const summary = this.calculateOrderSummary(enhancedOrders);
      
      console.log('[Delhivery API] Orders fetched successfully:', {
        totalOrders: enhancedOrders.length,
        page,
        limit
      });

      return {
        orders: enhancedOrders,
        pagination: {
          page,
          limit,
          total: enhancedOrders.length,
          totalPages: Math.ceil(enhancedOrders.length / limit),
          hasNextPage: page * limit < enhancedOrders.length,
          hasPreviousPage: page > 1
        },
        summary
      };
    } catch (error) {
      console.error('[Delhivery API] Error fetching orders:', error);
      
      // Return empty result instead of throwing error
      return {
        orders: [],
        summary: {
          totalOrders: 0,
          pendingOrders: 0,
          inTransitOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalAmount: 0,
          totalCodAmount: 0,
          totalPrepaidAmount: 0
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
  }

  /**
   * Fetch orders by specific waybill numbers
   */
  async fetchOrdersByWaybills(waybills: string[]): Promise<any[]> {
    if (!waybills || waybills.length === 0) {
      return [];
    }

    const apiUrl = `${this.baseUrl}/api/v1/packages/json/`;
    const orders: any[] = [];

    console.log('[Delhivery API] Fetching orders by waybills:', {
      waybills,
      environment: 'PRODUCTION'
    });

    // Process waybills in batches to avoid URL length limits
    const batchSize = 20;
    for (let i = 0; i < waybills.length; i += batchSize) {
      const batch = waybills.slice(i, i + batchSize);
      
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('waybill', batch.join(','));
        
        const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Delhivery API] Batch waybill fetch error:', response.status, errorText);
          continue; // Skip this batch but continue with others
        }

        const result = await response.json();
        
        // Handle packages API response format
        if (result.ShipmentData && Array.isArray(result.ShipmentData)) {
          const batchOrders = result.ShipmentData.map((item: any) => item.Shipment).filter(Boolean);
          orders.push(...batchOrders);
        } else if (result.data && Array.isArray(result.data)) {
          orders.push(...result.data);
        } else if (Array.isArray(result)) {
          orders.push(...result);
        }

        // Small delay between batches
        if (i + batchSize < waybills.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('[Delhivery API] Error fetching batch:', batch, error);
      }
    }

    return await this.enhanceOrderData(orders);
  }

  /**
   * Fetch order details by reference number
   */
  async fetchOrderByReference(referenceNumber: string): Promise<any | null> {
    const apiUrl = `${this.baseUrl}/api/v1/packages/json/`;
    
    console.log('[Delhivery API] Fetching order by reference:', {
      referenceNumber,
      environment: 'PRODUCTION'
    });

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('ref_ids', referenceNumber);
      
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Delhivery API] Order by reference fetch error:', response.status, errorText);
        return null;
      }

      const result = await response.json();
      
      // Handle packages API response format
      let orders = [];
      if (result.ShipmentData && Array.isArray(result.ShipmentData)) {
        orders = result.ShipmentData.map((item: any) => item.Shipment).filter(Boolean);
      } else if (result.data && Array.isArray(result.data)) {
        orders = result.data;
      } else if (Array.isArray(result)) {
        orders = result;
      }
      
      if (orders.length === 0) {
        return null;
      }

      const enhancedOrders = await this.enhanceOrderData(orders);
      return enhancedOrders[0];
    } catch (error) {
      console.error('[Delhivery API] Error fetching order by reference:', error);
      return null;
    }
  }

  /**
   * Get order analytics and statistics
   */
  async getOrderAnalytics(options: {
    fromDate?: string;
    toDate?: string;
    groupBy?: 'day' | 'week' | 'month' | 'state' | 'city' | 'status';
  } = {}): Promise<{
    totalOrders: number;
    totalAmount: number;
    averageOrderValue: number;
    deliveryRate: number;
    cancellationRate: number;
    returnsRate: number;
    codPercentage: number;
    prepaidPercentage: number;
    topStates: Array<{ state: string; count: number; percentage: number }>;
    topCities: Array<{ city: string; count: number; percentage: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
    dailyTrends: Array<{ date: string; orders: number; amount: number }>;
    performanceMetrics: {
      averageDeliveryTime: number;
      onTimeDeliveryRate: number;
      firstAttemptDeliveryRate: number;
      customerSatisfactionScore: number;
    };
  }> {
    const { fromDate, toDate, groupBy = 'day' } = options;

    console.log('[Delhivery API] Fetching order analytics:', {
      fromDate,
      toDate,
      groupBy,
      environment: 'PRODUCTION'
    });

    // Fetch all orders for the specified period
    const ordersResult = await this.fetchOrders({
      fromDate,
      toDate,
      limit: 10000 // Large limit to get all orders for analytics
    });

    const orders = ordersResult.orders;
    const totalOrders = orders.length;

    if (totalOrders === 0) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        averageOrderValue: 0,
        deliveryRate: 0,
        cancellationRate: 0,
        returnsRate: 0,
        codPercentage: 0,
        prepaidPercentage: 0,
        topStates: [],
        topCities: [],
        statusBreakdown: [],
        dailyTrends: [],
        performanceMetrics: {
          averageDeliveryTime: 0,
          onTimeDeliveryRate: 0,
          firstAttemptDeliveryRate: 0,
          customerSatisfactionScore: 0
        }
      };
    }

    // Calculate basic metrics
    const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const averageOrderValue = totalAmount / totalOrders;

    // Status analysis
    const statusCounts = orders.reduce((acc: any, order) => {
      const status = order.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const deliveredCount = statusCounts['Delivered'] || 0;
    const cancelledCount = statusCounts['Cancelled'] || 0;
    const returnsCount = statusCounts['RTO'] || 0;

    const deliveryRate = (deliveredCount / totalOrders) * 100;
    const cancellationRate = (cancelledCount / totalOrders) * 100;
    const returnsRate = (returnsCount / totalOrders) * 100;

    // Payment mode analysis
    const codOrders = orders.filter(order => order.payment_mode === 'COD').length;
    const prepaidOrders = orders.filter(order => order.payment_mode === 'Prepaid').length;
    
    const codPercentage = (codOrders / totalOrders) * 100;
    const prepaidPercentage = (prepaidOrders / totalOrders) * 100;

    // Geographic analysis
    const stateCounts = orders.reduce((acc: any, order) => {
      const state = order.state || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    const cityCounts = orders.reduce((acc: any, order) => {
      const city = order.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const topStates = Object.entries(stateCounts)
      .map(([state, count]) => ({
        state,
        count: count as number,
        percentage: ((count as number) / totalOrders) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({
        city,
        count: count as number,
        percentage: ((count as number) / totalOrders) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statusBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count: count as number,
        percentage: ((count as number) / totalOrders) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Daily trends
    const dailyTrends = this.calculateDailyTrends(orders, groupBy);

    // Performance metrics (calculated based on available data)
    const performanceMetrics = {
      averageDeliveryTime: this.calculateAverageDeliveryTime(orders),
      onTimeDeliveryRate: this.calculateOnTimeDeliveryRate(orders),
      firstAttemptDeliveryRate: this.calculateFirstAttemptDeliveryRate(orders),
      customerSatisfactionScore: 4.2 // Placeholder - would need actual customer feedback data
    };

    return {
      totalOrders,
      totalAmount,
      averageOrderValue,
      deliveryRate,
      cancellationRate,
      returnsRate,
      codPercentage,
      prepaidPercentage,
      topStates,
      topCities,
      statusBreakdown,
      dailyTrends,
      performanceMetrics
    };
  }

  /**
   * Search orders with advanced filters
   */
  async searchOrders(searchQuery: {
    query?: string; // General search across multiple fields
    waybill?: string;
    referenceNumber?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    address?: string;
    pincode?: string;
    amount?: { min?: number; max?: number };
    dateRange?: { from?: string; to?: string };
    status?: string[];
    paymentMode?: string[];
    states?: string[];
    cities?: string[];
    limit?: number;
    page?: number;
  }): Promise<{
    orders: any[];
    totalResults: number;
    searchTime: number;
    suggestions: string[];
  }> {
    const startTime = Date.now();
    
    console.log('[Delhivery API] Searching orders with query:', {
      searchQuery,
      environment: 'PRODUCTION'
    });

    const {
      query,
      waybill,
      referenceNumber,
      customerName,
      customerPhone,
      customerEmail,
      address,
      pincode,
      amount,
      dateRange,
      status,
      paymentMode,
      states,
      cities,
      limit = 100,
      page = 1
    } = searchQuery;

    // Build search parameters
    const searchParams: any = {
      limit,
      page
    };

    if (dateRange?.from) searchParams.fromDate = dateRange.from;
    if (dateRange?.to) searchParams.toDate = dateRange.to;
    if (status && status.length > 0) searchParams.status = status.join(',');
    if (paymentMode && paymentMode.length > 0) searchParams.paymentMode = paymentMode.join(',');
    if (states && states.length > 0) searchParams.state = states.join(',');
    if (cities && cities.length > 0) searchParams.city = cities.join(',');
    if (waybill) searchParams.waybill = waybill;
    if (referenceNumber) searchParams.referenceNumber = referenceNumber;

    // Fetch orders with basic filters
    const ordersResult = await this.fetchOrders(searchParams);
    let orders = ordersResult.orders;

    // Apply additional client-side filters
    if (query) {
      const queryLower = query.toLowerCase();
      orders = orders.filter(order => 
        (order.waybill || '').toLowerCase().includes(queryLower) ||
        (order.reference_number || '').toLowerCase().includes(queryLower) ||
        (order.customer_name || '').toLowerCase().includes(queryLower) ||
        (order.customer_phone || '').toLowerCase().includes(queryLower) ||
        (order.customer_email || '').toLowerCase().includes(queryLower) ||
        (order.address || '').toLowerCase().includes(queryLower) ||
        (order.city || '').toLowerCase().includes(queryLower) ||
        (order.state || '').toLowerCase().includes(queryLower)
      );
    }

    if (customerName) {
      const nameLower = customerName.toLowerCase();
      orders = orders.filter(order => 
        (order.customer_name || '').toLowerCase().includes(nameLower)
      );
    }

    if (customerPhone) {
      orders = orders.filter(order => 
        (order.customer_phone || '').includes(customerPhone)
      );
    }

    if (customerEmail) {
      const emailLower = customerEmail.toLowerCase();
      orders = orders.filter(order => 
        (order.customer_email || '').toLowerCase().includes(emailLower)
      );
    }

    if (address) {
      const addressLower = address.toLowerCase();
      orders = orders.filter(order => 
        (order.address || '').toLowerCase().includes(addressLower)
      );
    }

    if (pincode) {
      orders = orders.filter(order => 
        (order.pincode || '').includes(pincode)
      );
    }

    if (amount) {
      orders = orders.filter(order => {
        const orderAmount = parseFloat(order.total_amount) || 0;
        if (amount.min !== undefined && orderAmount < amount.min) return false;
        if (amount.max !== undefined && orderAmount > amount.max) return false;
        return true;
      });
    }

    const searchTime = Date.now() - startTime;
    
    // Generate search suggestions based on results
    const suggestions = this.generateSearchSuggestions(orders, searchQuery);

    return {
      orders,
      totalResults: orders.length,
      searchTime,
      suggestions
    };
  }

  /**
   * Enhanced order data with tracking and additional info
   */
  private async enhanceOrderData(orders: any[]): Promise<any[]> {
    const enhancedOrders = [];
    
    for (const order of orders) {
      try {
        let enhancedOrder = { ...order };
        
        // Add tracking information if waybill exists
        if (order.waybill) {
          try {
            const trackingInfo = await this.getShipmentStatus(order.waybill);
            enhancedOrder.trackingInfo = trackingInfo;
            enhancedOrder.lastUpdate = trackingInfo.timestamp;
            enhancedOrder.currentLocation = trackingInfo.location;
          } catch (error) {
            console.warn('[Delhivery API] Could not fetch tracking for waybill:', order.waybill);
          }
        }
        
        // Add computed fields
        enhancedOrder.daysSinceOrder = this.calculateDaysSinceOrder(order.order_date);
        enhancedOrder.isDelayed = this.isOrderDelayed(order);
        enhancedOrder.priority = this.calculateOrderPriority(order);
        enhancedOrder.deliveryStatus = this.getDeliveryStatus(order);
        
        enhancedOrders.push(enhancedOrder);
      } catch (error) {
        console.error('[Delhivery API] Error enhancing order:', order.waybill || order.reference_number, error);
        enhancedOrders.push(order); // Add original order if enhancement fails
      }
    }
    
    return enhancedOrders;
  }

  /**
   * Calculate order summary statistics
   */
  private calculateOrderSummary(orders: any[]): {
    totalOrders: number;
    pendingOrders: number;
    inTransitOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalAmount: number;
    totalCodAmount: number;
    totalPrepaidAmount: number;
  } {
    const summary = {
      totalOrders: orders.length,
      pendingOrders: 0,
      inTransitOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalAmount: 0,
      totalCodAmount: 0,
      totalPrepaidAmount: 0
    };

    for (const order of orders) {
      const status = (order.status || '').toLowerCase();
      const amount = parseFloat(order.total_amount) || 0;
      const paymentMode = (order.payment_mode || '').toLowerCase();

      // Status categorization
      if (status.includes('delivered')) {
        summary.deliveredOrders++;
      } else if (status.includes('cancelled') || status.includes('rto')) {
        summary.cancelledOrders++;
      } else if (status.includes('transit') || status.includes('shipped')) {
        summary.inTransitOrders++;
      } else {
        summary.pendingOrders++;
      }

      // Amount calculation
      summary.totalAmount += amount;
      if (paymentMode === 'cod') {
        summary.totalCodAmount += amount;
      } else {
        summary.totalPrepaidAmount += amount;
      }
    }

    return summary;
  }

  /**
   * Calculate daily trends for analytics
   */
  private calculateDailyTrends(orders: any[], groupBy: string): Array<{ date: string; orders: number; amount: number }> {
    const trends: { [key: string]: { orders: number; amount: number } } = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = orderDate.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = orderDate.toISOString().substring(0, 7);
          break;
        default:
          key = orderDate.toISOString().split('T')[0];
      }
      
      if (!trends[key]) {
        trends[key] = { orders: 0, amount: 0 };
      }
      
      trends[key].orders++;
      trends[key].amount += parseFloat(order.total_amount) || 0;
    });

    return Object.entries(trends)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate average delivery time
   */
  private calculateAverageDeliveryTime(orders: any[]): number {
    const deliveredOrders = orders.filter(order => 
      (order.status || '').toLowerCase().includes('delivered')
    );
    
    if (deliveredOrders.length === 0) return 0;
    
    const totalDeliveryTime = deliveredOrders.reduce((sum, order) => {
      const orderDate = new Date(order.order_date);
      const deliveryDate = new Date(order.delivery_date || order.lastUpdate || Date.now());
      const deliveryTime = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + deliveryTime;
    }, 0);
    
    return totalDeliveryTime / deliveredOrders.length;
  }

  /**
   * Calculate on-time delivery rate
   */
  private calculateOnTimeDeliveryRate(orders: any[]): number {
    const deliveredOrders = orders.filter(order => 
      (order.status || '').toLowerCase().includes('delivered')
    );
    
    if (deliveredOrders.length === 0) return 0;
    
    const onTimeOrders = deliveredOrders.filter(order => {
      const orderDate = new Date(order.order_date);
      const deliveryDate = new Date(order.delivery_date || order.lastUpdate || Date.now());
      const deliveryTime = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Consider on-time if delivered within expected timeframe
      const expectedDeliveryTime = order.shipping_mode === 'Express' ? 2 : 5;
      return deliveryTime <= expectedDeliveryTime;
    });
    
    return (onTimeOrders.length / deliveredOrders.length) * 100;
  }

  /**
   * Calculate first attempt delivery rate
   */
  private calculateFirstAttemptDeliveryRate(orders: any[]): number {
    const deliveredOrders = orders.filter(order => 
      (order.status || '').toLowerCase().includes('delivered')
    );
    
    if (deliveredOrders.length === 0) return 0;
    
    // This would require tracking scan data to determine first attempt success
    // For now, return an estimated rate
    return 85; // Placeholder value
  }

  /**
   * Generate search suggestions based on query and results
   */
  private generateSearchSuggestions(orders: any[], searchQuery: any): string[] {
    const suggestions: string[] = [];
    
    // If no results, suggest alternative searches
    if (orders.length === 0) {
      if (searchQuery.query) {
        suggestions.push(`Try searching for "${searchQuery.query}" in customer names`);
        suggestions.push(`Try searching for "${searchQuery.query}" in addresses`);
      }
      suggestions.push('Try broadening your date range');
      suggestions.push('Try removing some filters');
    }
    
    // If few results, suggest related searches
    if (orders.length > 0 && orders.length < 5) {
      const states = [...new Set(orders.map(o => o.state).filter(Boolean))];
      const cities = [...new Set(orders.map(o => o.city).filter(Boolean))];
      
      if (states.length > 0) {
        suggestions.push(`Also search in ${states.join(', ')}`);
      }
      if (cities.length > 0) {
        suggestions.push(`Also search in ${cities.join(', ')}`);
      }
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * Helper functions for order enhancement
   */
  private calculateDaysSinceOrder(orderDate: string): number {
    const order = new Date(orderDate);
    const now = new Date();
    return Math.floor((now.getTime() - order.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isOrderDelayed(order: any): boolean {
    const daysSinceOrder = this.calculateDaysSinceOrder(order.order_date);
    const expectedDeliveryTime = order.shipping_mode === 'Express' ? 2 : 5;
    const status = (order.status || '').toLowerCase();
    
    return daysSinceOrder > expectedDeliveryTime && !status.includes('delivered');
  }

  private calculateOrderPriority(order: any): 'high' | 'medium' | 'low' {
    const amount = parseFloat(order.total_amount) || 0;
    const isDelayed = this.isOrderDelayed(order);
    const paymentMode = (order.payment_mode || '').toLowerCase();
    
    if (isDelayed || amount > 10000 || paymentMode === 'cod') {
      return 'high';
    } else if (amount > 5000) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getDeliveryStatus(order: any): string {
    const status = (order.status || '').toLowerCase();
    
    if (status.includes('delivered')) return 'delivered';
    if (status.includes('cancelled') || status.includes('rto')) return 'cancelled';
    if (status.includes('transit') || status.includes('shipped')) return 'in_transit';
    if (status.includes('picked')) return 'picked_up';
    if (status.includes('manifest')) return 'ready_for_pickup';
    
    return 'pending';
  }

  /**
   * Generate shipping label for a waybill
   */
  async generateShippingLabel(waybill: string, options: { pdf?: boolean; pdf_size?: 'A4' | '4R' } = {}): Promise<any> {
    const { pdf = true, pdf_size = '4R' } = options;
    const apiUrl = `${this.baseUrl}/api/p/packing_slip?wbns=${waybill}&pdf=${pdf}&pdf_size=${pdf_size}`;

    console.log('[Delhivery API] Generating shipping label:', {
      waybill,
      pdf,
      pdf_size,
      url: apiUrl,
      environment: 'PRODUCTION'
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Delhivery API] Shipping label generation error:', response.status, errorText);
      throw new Error(`Failed to generate shipping label: ${response.status} - ${errorText}`);
    }

    if (pdf) {
      // For PDF, return the response text (which should be a URL or PDF data)
      const result = await response.text();
      console.log('[Delhivery API] PDF label generated successfully');
      return result;
    } else {
      // For JSON, return the parsed response
      const result = await response.json();
      console.log('[Delhivery API] JSON label data generated successfully');
      return result;
    }
  }

  /**
   * END OF ORDER MANAGEMENT FUNCTIONALITY
   */
}

export const delhiveryAPI = new DelhiveryAPI();
