// Shipment Type Definitions

export interface ShipmentDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ShipmentPackage {
  weight: number;
  dimensions: ShipmentDimensions;
  waybill?: string;
}

export interface ShipmentCustomFields {
  fragile_shipment?: boolean;
  dangerous_good?: boolean;
  plastic_packaging?: boolean;
  seller_inv?: string;
  hsn_code?: string;
  ewb?: string;
  waybill?: string;
  auto_generate_hsn?: boolean;
  auto_generate_waybill?: boolean;
}

export interface ShipmentCreateRequest {
  orderId: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  weight?: number;
  dimensions?: ShipmentDimensions;
  packages?: ShipmentPackage[];
  customFields?: ShipmentCustomFields;
  auto_hsn_code?: string;
  auto_waybill?: string;
  productCategory?: string;
}

export interface ShipmentDetails {
  waybillNumbers: string[];
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  weight?: number;
  dimensions?: ShipmentDimensions;
  packages?: ShipmentPackage[];
  masterWaybill?: string;
  childWaybills?: string[];
  createdAt: string;
  delhiveryResponse?: any;
  pickupRequest?: PickupRequest;
}

export interface WarehouseInfo {
  name: string;
  address: string;
  pincode: string;
  phone: string;
  active: boolean;
  location?: string; // For backward compatibility
}

export interface ShipmentData {
  orderId: string;
  status: string;
  hasShipment: boolean;
  shipmentCreated?: boolean;
  shipmentDetails?: ShipmentDetails;
  reverseShipment?: ShipmentDetails;
  replacementShipment?: ShipmentDetails;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    country: string;
  };
  availableActions: string[];
  warehouses: WarehouseInfo[];
  canCreateShipment: boolean;
}

export interface ShipmentManagerProps {
  orderId: string;
  onShipmentCreated?: (data?: any) => void;
  className?: string;
}

export interface TrackingInfo {
  waybill: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  scans: Array<{
    location: string;
    status: string;
    instructions: string;
    description: string;
    date: string;
    timestamp: string;
  }>;
  isAvailable?: boolean;
  message?: string;
}

export interface DelhiveryShipmentPayload {
  shipments: Array<{
    name: string;
    add: string;
    pin: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    order: string;
    payment_mode: string;
    return_pin: string;
    return_city: string;
    return_phone: string;
    return_add: string;
    return_state: string;
    return_country: string;
    products_desc: string;
    hsn_code?: string;
    cod_amount: string;
    order_date: string;
    total_amount: string;
    seller_add: string;
    seller_name: string;
    seller_inv: string;
    quantity: string;
    waybill?: string;
    shipment_width: number;
    shipment_height: number;
    weight: number;
    seller_gst_tin: string;
    shipping_mode: string;
    address_type: string;
    seller_tin?: string;
    seller_cst?: string;
    fragile_shipment?: string;
    dangerous_good?: string;
    plastic_packaging?: string;
    ewb?: string;
  }>;
  pickup_location: {
    name: string;
  };
}

export interface DelhiveryWaybillResponse {
  waybill: string;
  status: string;
  refnum: string;
  upload_wbn: string;
  packages?: Array<{
    status: string;
    client: string;
    sort_code: string;
    remarks: string[];
    waybill: string;
    refnum: string;
    cod: number;
  }>;
  rmk?: string;
}

export interface DelhiveryCreateResponse {
  success: boolean;
  packages: DelhiveryWaybillResponse[];
  rmk?: string;
  cash_pickups_count?: number;
  prepaid_pickups_count?: number;
  cash_pickups_amount?: number;
}

export interface MPSShipmentRequest extends Omit<ShipmentCreateRequest, 'weight' | 'dimensions'> {
  packages: ShipmentPackage[];
}

export interface ShipmentAPIResponse {
  success: boolean;
  data?: ShipmentData;
  error?: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  data?: {
    shipmentDetails: ShipmentDetails;
    delhiveryResponse: DelhiveryCreateResponse;
  };
  error?: string;
}

export interface WaybillsResponse {
  success: boolean;
  data?: {
    waybills: string[];
    delhiveryResponse: DelhiveryCreateResponse;
  };
  error?: string;
}

export interface TrackingResponse {
  success: boolean;
  data?: TrackingInfo;
  error?: string;
}

export interface PickupRequest {
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  expected_package_count: number;
  pickup_id?: string;
  response?: any;
  error?: string;
  attempted?: boolean;
}

// Extended Order Management Types

export interface OrderFilter {
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
}

export interface OrderSearchQuery {
  query?: string;
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
}

export interface OrderSearchResult {
  orders: EnhancedOrder[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  totalCodAmount: number;
  totalPrepaidAmount: number;
}

export interface OrdersResponse {
  orders: EnhancedOrder[];
  pagination: OrderPagination;
  summary: OrderSummary;
}

export interface EnhancedOrder {
  waybill?: string;
  reference_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_amount?: string;
  payment_mode?: string;
  order_date?: string;
  status?: string;
  shipping_mode?: string;
  delivery_date?: string;
  trackingInfo?: {
    status: string;
    statusCode: string;
    location: string;
    timestamp: string;
    remarks: string;
    isDelivered: boolean;
    isInTransit: boolean;
    isPickedUp: boolean;
    estimatedDelivery?: string;
  };
  lastUpdate?: string;
  currentLocation?: string;
  daysSinceOrder?: number;
  isDelayed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  deliveryStatus?: string;
  [key: string]: any;
}

export interface OrderAnalytics {
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
}

export interface OrderManagementAPI {
  fetchOrders: (filters?: OrderFilter) => Promise<OrdersResponse>;
  fetchOrdersByWaybills: (waybills: string[]) => Promise<EnhancedOrder[]>;
  fetchOrderByReference: (referenceNumber: string) => Promise<EnhancedOrder | null>;
  searchOrders: (query: OrderSearchQuery) => Promise<OrderSearchResult>;
  getOrderAnalytics: (options?: { fromDate?: string; toDate?: string; groupBy?: string }) => Promise<OrderAnalytics>;
}

export interface BulkOrderAction {
  action: 'update_status' | 'cancel' | 'create_pickup' | 'generate_labels' | 'export_csv' | 'assign_waybills';
  orderIds: string[];
  waybills?: string[];
  data?: any;
}

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
  data?: any;
}
