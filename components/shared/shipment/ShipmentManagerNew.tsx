'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  Plus,
  Minus,
  RotateCcw,
  Replace,
  Weight,
  Ruler,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  BoxSelect
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  _id: string;
  name: string;
  image: string | null;
  qty: number;
  price: number;
  size: string | null;
  color: string | null;
  status: string; // 'Not Processed' | 'Processing' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled'
  waybillNumber: string | null;
  weightPerUnit: number; // grams
  weightTotal: number;   // grams  (qty × weightPerUnit)
  dimensions: { length: number; width: number; height: number }; // cm
}

interface ShipmentDetails {
  waybillNumbers: string[];
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  packages?: Array<{
    weight: number;
    dimensions: { length: number; width: number; height: number };
    waybill?: string;
  }>;
  masterWaybill?: string;
  childWaybills?: string[];
  createdAt: string;
  selectedItemIds?: string[];
}

interface ShipmentData {
  orderId: string;
  status: string;
  shipmentCreated: boolean;
  shipmentDetails?: ShipmentDetails;
  reverseShipment?: any;
  replacementShipment?: any;
  availableActions: string[];
  warehouses: Array<{ name: string; location: string }>;
  canCreateShipment: boolean;
  orderItems: OrderItem[];
  calculatedTotalWeight: number;
  paymentMethod?: string;
  totalAmount?: number;
}

interface CreateRequest {
  orderId: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  weight: number;
  dimensions: { length: number; width: number; height: number };
  packages: Array<{ weight: number; dimensions: { length: number; width: number; height: number } }>;
  customFields: {
    fragile_shipment: boolean;
    dangerous_good: boolean;
    plastic_packaging: boolean;
    hsn_code: string;
    ewb: string;
  };
  selectedItemIds: string[];
  totalAmount?: number;
}

interface Props {
  orderId: string;
  preSelectedItemId?: string;
  onShipmentCreated?: (data: any) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Dispatched': { label: 'Dispatched', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  'Delivered':  { label: 'Delivered',  color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-500'  },
  'Confirmed':  { label: 'Confirmed',  color: 'text-yellow-700',bg: 'bg-yellow-50 border-yellow-200',dot: 'bg-yellow-500'},
  'Processing': { label: 'Processing', color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200',dot: 'bg-orange-500'},
  'Cancelled':  { label: 'Cancelled',  color: 'text-red-700',   bg: 'bg-red-50 border-red-200',      dot: 'bg-red-500'  },
  'Not Processed':{ label: 'Pending',  color: 'text-gray-700',  bg: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Not Processed'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShipmentManager({ orderId, preSelectedItemId, onShipmentCreated, className }: Props) {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Form state
  const [createData, setCreateData] = useState<CreateRequest>({
    orderId,
    shipmentType: 'FORWARD',
    pickupLocation: '',
    shippingMode: 'Surface',
    weight: 500,
    dimensions: { length: 10, width: 10, height: 10 },
    packages: [],
    customFields: { fragile_shipment: false, dangerous_good: false, plastic_packaging: false, hsn_code: '', ewb: '' },
    selectedItemIds: [],
    totalAmount: 0,
  });

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchShipmentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipment?orderId=${orderId}`);
      const result = await res.json();
      if (result.success) {
        const data: ShipmentData = result.data;
        setShipmentData(data);

        // If a specific item was requested (from per-product shipment button), pre-select only that item
        // Otherwise auto-select all unshipped items
        const unshipped = data.orderItems
          .filter(i => !i.waybillNumber && i.status !== 'Dispatched' && i.status !== 'Delivered')
          .map(i => i._id);

        const initialSelection = (preSelectedItemId && unshipped.includes(preSelectedItemId))
          ? [preSelectedItemId]  // Individual product shipment: only that item
          : unshipped;           // Full/partial: all unshipped items

        // Calculate default weight + dims from initial selection
        const { weight, dimensions } = calcWeightAndDims(initialSelection, data.orderItems);

        setCreateData(prev => ({
          ...prev,
          pickupLocation: prev.pickupLocation || data.warehouses?.[0]?.name || '',
          selectedItemIds: initialSelection,
          weight,
          dimensions,
          totalAmount: data.totalAmount || prev.totalAmount,
        }));

        // Auto-open create form when a specific item is pre-selected (direct from product row button)
        if (preSelectedItemId && unshipped.includes(preSelectedItemId)) {
          setShowCreateForm(true);
        }
      } else {
        setError(result.error || 'Failed to fetch shipment data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchShipmentData(); }, [fetchShipmentData]);

  // ─── Weight / Dimensions calculation ─────────────────────────────────────

  /**
   * Given selected item IDs and full item list, return combined weight (g) and max dimensions (cm).
   */
  function calcWeightAndDims(
    selectedIds: string[],
    items: OrderItem[]
  ): { weight: number; dimensions: { length: number; width: number; height: number } } {
    if (selectedIds.length === 0) return { weight: 500, dimensions: { length: 10, width: 10, height: 10 } };

    const selected = items.filter(i => selectedIds.includes(i._id));
    const totalWeight = Math.max(
      500,
      selected.reduce((sum, item) => sum + item.weightTotal, 0)
    );
    // Use max dimension across selected items for box fit
    const maxDims = selected.reduce(
      (acc, item) => ({
        length: Math.max(acc.length, item.dimensions.length),
        width:  Math.max(acc.width,  item.dimensions.width),
        height: Math.max(acc.height, item.dimensions.height),
      }),
      { length: 10, width: 10, height: 10 }
    );
    return { weight: Math.round(totalWeight), dimensions: maxDims };
  }

  // ─── Toggle item selection ────────────────────────────────────────────────

  const toggleItem = (itemId: string) => {
    setCreateData(prev => {
      const already = prev.selectedItemIds.includes(itemId);
      const newIds = already
        ? prev.selectedItemIds.filter(id => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      const { weight, dimensions } = calcWeightAndDims(newIds, shipmentData?.orderItems || []);
      return { ...prev, selectedItemIds: newIds, weight, dimensions };
    });
  };

  const selectAll = () => {
    if (!shipmentData) return;
    const unshipped = shipmentData.orderItems
      .filter(i => !i.waybillNumber && i.status !== 'Dispatched' && i.status !== 'Delivered')
      .map(i => i._id);
    const { weight, dimensions } = calcWeightAndDims(unshipped, shipmentData.orderItems);
    setCreateData(prev => ({ ...prev, selectedItemIds: unshipped, weight, dimensions }));
  };

  const clearSelection = () => {
    setCreateData(prev => ({ ...prev, selectedItemIds: [], weight: 500, dimensions: { length: 10, width: 10, height: 10 } }));
  };

  // ─── Action selection ─────────────────────────────────────────────────────

  const handleActionSelect = (action: string) => {
    if (!shipmentData) return;
    const unshipped = shipmentData.orderItems
      .filter(i => !i.waybillNumber && i.status !== 'Dispatched' && i.status !== 'Delivered')
      .map(i => i._id);
    const { weight, dimensions } = calcWeightAndDims(unshipped, shipmentData.orderItems);

    setCreateData(prev => ({
      ...prev,
      shipmentType: action as any,
      selectedItemIds: action === 'FORWARD' || action === 'MPS' ? unshipped : [],
      weight,
      dimensions,
      packages: action === 'MPS' ? [{ weight, dimensions }] : [],
    }));
    setShowCreateForm(true);
  };

  // ─── MPS package helpers ──────────────────────────────────────────────────

  const addPackage = () => {
    setCreateData(prev => ({
      ...prev,
      packages: [...prev.packages, { weight: 500, dimensions: { length: 10, width: 10, height: 10 } }],
    }));
  };

  const removePackage = (index: number) => {
    setCreateData(prev => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }));
  };

  const updatePackage = (index: number, field: string, value: any) => {
    setCreateData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => i === index ? { ...pkg, [field]: value } : pkg),
    }));
  };

  // ─── Create shipment ──────────────────────────────────────────────────────

  const createShipment = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateForm(false);
        if (onShipmentCreated) onShipmentCreated(result.data);
        await fetchShipmentData(); // Refresh — item statuses will update
      } else {
        setError(result.error || 'Failed to create shipment');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setCreating(false);
    }
  };

  // ─── Computed helpers ─────────────────────────────────────────────────────

  const shippedItems   = shipmentData?.orderItems?.filter(i => i.status === 'Dispatched' || i.status === 'Delivered') || [];
  const unshippedItems = shipmentData?.orderItems?.filter(i => i.status !== 'Dispatched' && i.status !== 'Delivered') || [];
  const allShipped     = (shipmentData?.orderItems?.length ?? 0) > 0 && unshippedItems.length === 0;
  const partialShipped = shippedItems.length > 0 && unshippedItems.length > 0;

  const selectedCount    = createData.selectedItemIds.length;
  const totalSelectableCount = unshippedItems.length;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-10 ${className}`}>
        <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-500 text-sm">Loading shipment data…</span>
      </div>
    );
  }

  if (!shipmentData) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error || 'No shipment data available'}</span>
        </div>
        <button onClick={fetchShipmentData} className="mt-2 text-xs text-red-600 underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Shipment Management</h3>
          {allShipped  && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">✓ Fully Dispatched</span>}
          {partialShipped && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium border border-orange-200">⚡ Partially Shipped</span>}
        </div>
        <button onClick={fetchShipmentData} className="text-gray-400 hover:text-gray-600 p-1 rounded" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Forward shipment */}
        <div className={`border rounded-lg p-3 ${shipmentData.shipmentCreated && shipmentData.shipmentDetails ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700">Forward</span>
          </div>
          {shipmentData.shipmentCreated && shipmentData.shipmentDetails ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-xs text-green-700 font-medium">Created</span></div>
              <p className="text-xs text-gray-500">{shipmentData.shipmentDetails.waybillNumbers.length} waybill(s)</p>
              <p className="text-xs text-gray-500">{shipmentData.shipmentDetails.shippingMode}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-500">Not created</span></div>
          )}
        </div>

        {/* Reverse */}
        <div className={`border rounded-lg p-3 ${shipmentData.reverseShipment ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <RotateCcw className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-semibold text-gray-700">Reverse</span>
          </div>
          {shipmentData.reverseShipment ? (
            <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-xs text-green-700 font-medium">Created</span></div>
          ) : (
            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-500">Not created</span></div>
          )}
        </div>

        {/* Replacement */}
        <div className={`border rounded-lg p-3 ${shipmentData.replacementShipment ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Replace className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-semibold text-gray-700">Replacement</span>
          </div>
          {shipmentData.replacementShipment ? (
            <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-xs text-green-700 font-medium">Created</span></div>
          ) : (
            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-500">Not created</span></div>
          )}
        </div>
      </div>

      {/* ── Order Items Status Table ── */}
      {shipmentData?.orderItems && shipmentData.orderItems.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BoxSelect className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Order Items</span>
              <span className="text-xs text-gray-400">
                {shippedItems.length}/{shipmentData.orderItems.length} shipped
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${shipmentData?.orderItems && shipmentData.orderItems.length > 0 ? (shippedItems.length / shipmentData.orderItems.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {shipmentData.orderItems.length > 0 ? Math.round((shippedItems.length / shipmentData.orderItems.length) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {shipmentData?.orderItems && shipmentData.orderItems.map(item => {
              const isShipped = item.status === 'Dispatched' || item.status === 'Delivered' || !!item.waybillNumber;
              const sizeVal = typeof item.size === 'string' ? item.size : (item.size && typeof item.size === 'object' && (item.size as any).size) ? (item.size as any).size : null;
              const colorVal = typeof item.color === 'string' ? item.color : (item.color && typeof item.color === 'object' && (item.color as any).color) ? (item.color as any).color : null;
              return (
                <div key={item._id} className={`flex items-center gap-3 px-4 py-3 ${isShipped ? 'bg-green-50/40' : 'bg-white'}`}>
                  {/* Image */}
                  <div className="w-10 h-10 rounded-md border border-gray-200 bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <Package className="h-4 w-4 text-gray-400 m-auto mt-3" />
                    }
                  </div>

                  {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{String(item.name || 'Unknown Item')}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>Qty: {item.qty}</span>
                        {sizeVal && <><span>·</span><span>Size: {sizeVal}</span></>}
                        {colorVal && <><span>·</span><span>Color: {colorVal}</span></>}
                        <span>·</span>
                        <span>₹{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                    {/* Weight & dims hint */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Weight className="h-3 w-3" />
                      <span>{item.weightTotal}g</span>
                      <Ruler className="h-3 w-3 ml-1" />
                      <span>{item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} cm</span>
                    </div>
                  </div>

                  {/* Waybill */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={item.status} />
                    {item.waybillNumber && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-600">{item.waybillNumber}</span>
                        <button
                          onClick={() => window.open(`https://www.delhivery.com/track/package/${item.waybillNumber}`, '_blank')}
                          className="text-blue-500 hover:text-blue-700"
                          title="Track"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Available Actions ── */}
      {shipmentData && shipmentData.availableActions && shipmentData.availableActions.length > 0 && !showCreateForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-sm font-semibold text-gray-700 mb-3">Create New Shipment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {shipmentData.availableActions.map(action => (
              <button
                key={action}
                onClick={() => handleActionSelect(action)}
                className={`flex flex-col items-center p-3 border rounded-lg hover:shadow-sm transition-all text-sm font-medium gap-1.5
                  ${action === 'FORWARD'     ? 'border-blue-200   hover:bg-blue-50   text-blue-700'   : ''}
                  ${action === 'REVERSE'     ? 'border-orange-200 hover:bg-orange-50 text-orange-700' : ''}
                  ${action === 'REPLACEMENT' ? 'border-purple-200 hover:bg-purple-50 text-purple-700' : ''}
                  ${action === 'MPS'         ? 'border-green-200  hover:bg-green-50  text-green-700'  : ''}
                `}
              >
                {action === 'FORWARD'     && <Send     className="h-5 w-5" />}
                {action === 'REVERSE'     && <RotateCcw className="h-5 w-5" />}
                {action === 'REPLACEMENT' && <Replace  className="h-5 w-5" />}
                {action === 'MPS'         && <Package  className="h-5 w-5" />}
                <span>{action === 'MPS' ? 'Multi-Package' : String(action)}</span>
                <span className="text-xs font-normal opacity-70">
                  {action === 'FORWARD'     && 'Standard shipping'}
                  {action === 'REVERSE'     && 'Return pickup'}
                  {action === 'REPLACEMENT' && 'Exchange item'}
                  {action === 'MPS'         && 'Multiple boxes'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shipmentData.availableActions.length === 0 && !showCreateForm && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {allShipped
              ? 'All items have been dispatched. You can create a REVERSE or REPLACEMENT shipment after delivery.'
              : 'No shipment actions are available for the current order status.'}
          </p>
        </div>
      )}

      {/* ── Create Form ── */}
      {showCreateForm && (
        <div className="border border-blue-200 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-blue-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              {createData.shipmentType === 'FORWARD'     && <Send      className="h-4 w-4 text-blue-600" />}
              {createData.shipmentType === 'REVERSE'     && <RotateCcw className="h-4 w-4 text-orange-600" />}
              {createData.shipmentType === 'REPLACEMENT' && <Replace   className="h-4 w-4 text-purple-600" />}
              {createData.shipmentType === 'MPS'         && <Package   className="h-4 w-4 text-green-600" />}
              <h4 className="font-semibold text-gray-800">
                Create {createData.shipmentType === 'MPS' ? 'Multi-Package' : createData.shipmentType} Shipment
              </h4>
            </div>
            <button onClick={() => { setShowCreateForm(false); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Pickup & Mode ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Pickup Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={createData.pickupLocation}
                  onChange={e => setCreateData(p => ({ ...p, pickupLocation: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select warehouse —</option>
                  {shipmentData.warehouses.map(w => (
                    <option key={w.name} value={w.name}>{String(w.name)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Shipping Mode</label>
                <div className="flex gap-2">
                  {(['Surface', 'Express'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setCreateData(p => ({ ...p, shippingMode: mode }))}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors font-medium
                        ${createData.shippingMode === mode
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Item Selection (FORWARD / MPS) ── */}
            {(createData.shipmentType === 'FORWARD' || createData.shipmentType === 'MPS') && shipmentData.orderItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <Package className="h-3 w-3" /> Select Items to Ship
                  </label>
                  <div className="flex gap-2">
                    <button onClick={selectAll}    className="text-xs text-blue-600 hover:underline">Select all unshipped</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={clearSelection} className="text-xs text-gray-500 hover:underline">Clear</button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                  {shipmentData.orderItems.map(item => {
                    const isShipped   = item.status === 'Dispatched' || item.status === 'Delivered' || !!item.waybillNumber;
                    const isSelected  = createData.selectedItemIds.includes(item._id);
                    const sizeVal = typeof item.size === 'string' ? item.size : (item.size && typeof item.size === 'object' && (item.size as any).size) ? (item.size as any).size : null;
                    const colorVal = typeof item.color === 'string' ? item.color : (item.color && typeof item.color === 'object' && (item.color as any).color) ? (item.color as any).color : null;

                    return (
                      <div
                        key={item._id}
                        onClick={() => !isShipped && toggleItem(item._id)}
                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors
                          ${isShipped  ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}
                          ${!isShipped && isSelected  ? 'bg-blue-50' : ''}
                          ${!isShipped && !isSelected ? 'bg-white hover:bg-gray-50 cursor-pointer' : ''}
                        `}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected || isShipped}
                          disabled={isShipped}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        />

                        {/* Image */}
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded border border-gray-200 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                            <span>Qty: {item.qty}</span>
                            {sizeVal  && <span>· Size: {sizeVal}</span>}
                            {colorVal && <span>· {colorVal}</span>}
                            <span>· ₹{item.price.toFixed(2)}</span>
                            <span className="flex items-center gap-0.5">
                              <Weight className="h-3 w-3" />{item.weightTotal}g
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Ruler className="h-3 w-3" />{item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}cm
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <StatusBadge status={item.waybillNumber ? 'Dispatched' : item.status} />
                        {item.waybillNumber && (
                          <span className="text-xs font-mono text-gray-500 truncate max-w-[80px]">{item.waybillNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selection summary */}
                {selectedCount === 0 && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    ⚠ Please select at least one item to ship.
                  </p>
                )}
                {selectedCount > 0 && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <span className="font-semibold">{selectedCount} of {totalSelectableCount} unshipped item(s) selected</span>
                    {selectedCount < totalSelectableCount && (
                      <span className="text-orange-600 font-medium">→ Partial shipment</span>
                    )}
                    {selectedCount === totalSelectableCount && totalSelectableCount > 0 && (
                      <span className="text-green-600 font-medium">→ Full shipment</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Single Package Details (non-MPS) ── */}
            {createData.shipmentType !== 'MPS' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                  <Package className="h-3 w-3" /> Package Details
                  {(createData.shipmentType === 'FORWARD') && createData.selectedItemIds.length > 0 && (
                    <span className="ml-1 text-xs font-normal text-blue-600 normal-case">(auto-calculated from selected items)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Weight className="h-3 w-3" /> Weight (g)
                    </label>
                    <input
                      type="number" min="1"
                      value={createData.weight}
                      onChange={e => setCreateData(p => ({ ...p, weight: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> Length (cm)
                    </label>
                    <input
                      type="number" min="1"
                      value={createData.dimensions.length}
                      onChange={e => setCreateData(p => ({ ...p, dimensions: { ...p.dimensions, length: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (cm)</label>
                    <input
                      type="number" min="1"
                      value={createData.dimensions.width}
                      onChange={e => setCreateData(p => ({ ...p, dimensions: { ...p.dimensions, width: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
                    <input
                      type="number" min="1"
                      value={createData.dimensions.height}
                      onChange={e => setCreateData(p => ({ ...p, dimensions: { ...p.dimensions, height: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Manual Price Override */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                    💰 Total Amount (Price)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createData.totalAmount}
                    onChange={e => setCreateData(p => ({ ...p, totalAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-500 italic mt-1">Manual price override for this shipment</p>
                </div>
              </div>
            )}

            {/* ── MPS Packages ── */}
            {createData.shipmentType === 'MPS' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Multi-Package Details</label>
                  <button
                    type="button"
                    onClick={addPackage}
                    className="flex items-center text-xs px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Box
                  </button>
                </div>
                <div className="space-y-3">
                  {createData.packages.map((pkg, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Box {idx + 1}</span>
                        {createData.packages.length > 1 && (
                          <button onClick={() => removePackage(idx)} className="text-red-500 hover:text-red-700">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: 'Weight (g)', val: pkg.weight, field: 'weight', onChange: (v: number) => updatePackage(idx, 'weight', v) },
                        ].map(f => (
                          <div key={f.label}>
                            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                            <input type="number" min="1" value={f.val}
                              onChange={e => f.onChange(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          </div>
                        ))}
                        {['length', 'width', 'height'].map(dim => (
                          <div key={dim}>
                            <label className="block text-xs text-gray-500 mb-1 capitalize">{dim} (cm)</label>
                            <input type="number" min="1" value={(pkg.dimensions as any)[dim]}
                              onChange={e => updatePackage(idx, 'dimensions', { ...pkg.dimensions, [dim]: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Additional Options ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Additional Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {[
                    { key: 'fragile_shipment',  label: 'Fragile shipment' },
                    { key: 'dangerous_good',     label: 'Dangerous goods' },
                    { key: 'plastic_packaging',  label: 'Plastic packaging' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={(createData.customFields as any)[opt.key] || false}
                        onChange={e => setCreateData(p => ({ ...p, customFields: { ...p.customFields, [opt.key]: e.target.checked } }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">HSN Code (optional)</label>
                    <input type="text"
                      value={createData.customFields.hsn_code}
                      onChange={e => setCreateData(p => ({ ...p, customFields: { ...p.customFields, hsn_code: e.target.value } }))}
                      placeholder="e.g. 6403"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-waybill (≥ ₹50k)</label>
                    <input type="text"
                      value={createData.customFields.ewb}
                      onChange={e => setCreateData(p => ({ ...p, customFields: { ...p.customFields, ewb: e.target.value } }))}
                      placeholder="e-way bill number"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── Submit ── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => { setShowCreateForm(false); setError(null); }}
                disabled={creating}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createShipment}
                disabled={creating || !createData.pickupLocation || (
                  (createData.shipmentType === 'FORWARD' || createData.shipmentType === 'MPS') && selectedCount === 0
                )}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {creating ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><Send className="h-4 w-4" /> Create {createData.shipmentType === 'MPS' ? 'Multi-Package' : createData.shipmentType} Shipment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shipment Details (collapsible) ── */}
      {shipmentData.shipmentCreated && shipmentData.shipmentDetails && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowDetails(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Active Shipment Details
            </div>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDetails && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Waybill Numbers</p>
                  {shipmentData.shipmentDetails.waybillNumbers.map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-1.5 mb-1">
                      <span className="font-mono text-sm text-gray-800">{w}</span>
                      <button
                        onClick={() => window.open(`https://www.delhivery.com/track/package/${w}`, '_blank')}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pickup Location</p>
                  <p className="text-sm text-gray-700">{String(shipmentData.shipmentDetails.pickupLocation || 'N/A')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipping Mode</p>
                  <p className="text-sm text-gray-700">{shipmentData.shipmentDetails.shippingMode}</p>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipment Type</p>
                  <p className="text-sm text-gray-700">{shipmentData.shipmentDetails.shipmentType}</p>
                </div>
                {shipmentData.shipmentDetails.weight && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Package Weight</p>
                    <p className="text-sm text-gray-700">{shipmentData.shipmentDetails.weight}g</p>
                  </div>
                )}
                {shipmentData.shipmentDetails.dimensions && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dimensions</p>
                    <p className="text-sm text-gray-700">
                      {shipmentData.shipmentDetails.dimensions.length} × {shipmentData.shipmentDetails.dimensions.width} × {shipmentData.shipmentDetails.dimensions.height} cm
                    </p>
                  </div>
                )}
                {shipmentData.shipmentDetails.shipmentType === 'MPS' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Master Waybill</p>
                      <p className="text-sm font-mono text-gray-700">{shipmentData.shipmentDetails.masterWaybill}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Packages</p>
                      <p className="text-sm text-gray-700">{shipmentData.shipmentDetails.packages?.length || 0}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created</p>
                  <p className="text-sm text-gray-700">{new Date(shipmentData.shipmentDetails.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Shipped items for this shipment */}
              {shipmentData.shipmentDetails.selectedItemIds && shipmentData.shipmentDetails.selectedItemIds.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items in This Shipment</p>
                  <div className="space-y-1">
                    {shipmentData.orderItems
                      .filter(item => shipmentData.shipmentDetails!.selectedItemIds!.includes(item._id))
                      .map(item => (
                        <div key={item._id} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 border border-green-100 rounded px-3 py-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          <span className="font-medium flex-1 truncate">{item.name}</span>
                          <span className="text-xs text-gray-500">Qty: {item.qty}</span>
                          {item.waybillNumber && (
                            <span className="text-xs font-mono text-gray-500">{item.waybillNumber}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default ShipmentManager;
