/**
 * Delhivery API Type Definitions
 * Based on official Delhivery API documentation
 */

export interface DelhiveryShipmentData {
  // Required fields
  name: string;
  add: string;
  pin: string;
  phone: string;
  order: string;
  payment_mode: 'COD' | 'Prepaid' | 'Pickup' | 'REPL';
  
  // Optional address fields
  city?: string;
  state?: string;
  country?: string;
  address_type?: 'home' | 'office';
  
  // Return address fields
  return_name?: string;
  return_add?: string;
  return_city?: string;
  return_phone?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
  
  // Product and order details
  products_desc?: string;
  hsn_code?: string;
  cod_amount?: string;
  total_amount?: string;
  quantity?: string;
  
  // Seller information
  seller_name?: string;
  seller_add?: string;
  seller_inv?: string;
  
  // Shipment specifications
  weight?: string;
  shipment_width?: string;
  shipment_height?: string;
  shipment_length?: string;
  shipping_mode?: 'Surface' | 'Express';
  
  // Special handling
  fragile_shipment?: boolean;
  dangerous_good?: boolean;
  plastic_packaging?: boolean;
  
  // Compliance
  ewb?: string; // E-waybill number
  
  // Optional fields
  waybill?: string;
  order_date?: string | null;
  send_date?: string; // Required by Delhivery API to prevent NoneType errors
  end_date?: string; // Required by Delhivery API to prevent NoneType errors
  
  // MPS specific fields
  shipment_type?: 'MPS';
  mps_amount?: string;
  mps_children?: string;
  master_id?: string;
}

export interface DelhiveryCreatePayload {
  shipments: DelhiveryShipmentData[];
  pickup_location: {
    name: string;
  };
}

export interface DelhiveryPackageResponse {
  waybill: string;
  status: string;
  refnum?: string;
  upload_wbn?: string;
  client?: string;
  sort_code?: string;
  remarks?: string[];
  cod?: number;
  serviceable?: boolean;
  cash_pickups_count?: number;
  prepaid_pickups_count?: number;
  cash_pickups_amount?: number;
}

export interface DelhiveryCreateResponse {
  success: boolean;
  packages: DelhiveryPackageResponse[];
  rmk?: string;
  error?: string;
  cash_pickups_count?: number;
  prepaid_pickups_count?: number;
  cash_pickups_amount?: number;
}

export interface DelhiveryWaybillResponse {
  waybill: string;
  status: string;
  refnum: string;
  upload_wbn: string;
  packages?: DelhiveryPackageResponse[];
  rmk?: string;
}

export interface DelhiveryEditPayload {
  waybill: string;
  name?: string;
  add?: string;
  pin?: string;
  city?: string;
  state?: string;
  phone?: string;
  payment_mode?: 'COD' | 'Prepaid' | 'Pickup' | 'REPL';
  cod_amount?: string;
  weight?: string;
  shipment_width?: string;
  shipment_height?: string;
  shipment_length?: string;
  products_desc?: string;
  seller_name?: string;
  seller_add?: string;
  return_name?: string;
  return_add?: string;
  return_city?: string;
  return_phone?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
}

export interface DelhiveryEditResponse {
  success: boolean;
  waybill: string;
  message?: string;
  error?: string;
  rmk?: string;
}

export interface DelhiveryTrackingScan {
  ScanDetail: {
    Scan: string;
    ScanType: string;
    ScanDateTime: string;
    ScanLocation: string;
    Instructions: string;
    StatusDateTime: string;
  };
}

export interface DelhiveryTrackingShipment {
  Scans: DelhiveryTrackingScan[];
  Status: {
    Status: string;
    StatusDateTime: string;
    StatusLocation: string;
    Instructions: string;
  };
}

export interface DelhiveryTrackingData {
  Status: {
    Status: string;
    StatusDateTime: string;
    StatusLocation: string;
    Instructions: string;
  };
  Shipment: DelhiveryTrackingShipment;
}

export interface DelhiveryTrackingResponse {
  ShipmentTrack: DelhiveryTrackingData[];
}

export interface DelhiveryServiceabilityResponse {
  delivery_codes: Array<{
    postal_code: {
      pin: string;
      city: string;
      state: string;
      country: string;
    };
    is_oda: boolean;
    cash_on_delivery: boolean;
    pickup_available: boolean;
    is_cod_available: boolean;
    is_prepaid_available: boolean;
    is_surface_available: boolean;
    is_express_available: boolean;
  }>;
}

export interface DelhiveryError {
  success: false;
  error: string;
  details?: any;
}

// Waybill API responses
export interface DelhiveryWaybillBulkResponse {
  waybills?: string[];
  data?: string[];
  success?: boolean;
  message?: string;
}

export interface DelhiveryWaybillSingleResponse {
  waybill?: string;
  data?: string;
  success?: boolean;
  message?: string;
}

// Pincode serviceability responses
export interface DelhiveryPincodeServiceabilityResponse {
  pin?: string;
  remark?: string;
  pre_paid?: string;
  cash?: string;
  pickup?: string;
  repl?: string;
  cod?: string;
  is_oda?: boolean;
  oda_block?: string;
  is_odc?: boolean;
  odc_block?: string;
}

export interface DelhiveryHeavyPincodeResponse {
  pincode?: string;
  payment_type?: string | string[];
  message?: string;
  status?: string;
  cod?: boolean;
  prepaid?: boolean;
  pickup?: boolean;
  repl?: boolean;
}

// Serviceability check results
export interface ServiceabilityResult {
  serviceable: boolean;
  embargo: boolean;
  remark: string;
  details?: any;
}

export interface HeavyServiceabilityResult {
  serviceable: boolean;
  paymentTypes: string[];
  details?: any;
}

// Helper types for better type safety
export type DelhiveryShipmentType = 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
export type DelhiveryPaymentMode = 'COD' | 'Prepaid' | 'Pickup' | 'REPL';
export type DelhiveryShippingMode = 'Surface' | 'Express';
export type DelhiveryAddressType = 'home' | 'office';

// Configuration types
export interface DelhiveryConfig {
  authToken: string;
  baseUrl: string;
  environment: 'staging' | 'production';
}

// API Response wrapper
export type DelhiveryAPIResponse<T> = T | DelhiveryError;
