import mongoose from 'mongoose';

/**
 * Waybill Model
 * Stores pre-generated waybills for later use in shipment creation
 * 
 * As recommended by Delhivery API documentation:
 * - Waybills are generated in batches of 25 at the backend
 * - Using them immediately after fetching may occasionally result in errors
 * - Store them and use later during manifest creation
 */

interface IWaybill {
  waybill: string;
  status: 'GENERATED' | 'RESERVED' | 'USED' | 'CANCELLED';
  source: 'DELHIVERY_BULK' | 'DELHIVERY_SINGLE' | 'DEMO';
  generatedAt: Date;
  usedAt?: Date;
  orderId?: string;
  shipmentId?: string;
  reservedBy?: string;
  reservedAt?: Date;
  metadata?: Record<string, any>;
}

interface IWaybillMethods {
  reserve(reservedBy: string): Promise<IWaybill>;
  use(orderId: string, shipmentId: string): Promise<IWaybill>;
  cancel(): Promise<IWaybill>;
}

interface IWaybillStatics {
  getAvailableWaybills(count?: number, source?: string): Promise<IWaybill[]>;
  reserveWaybills(waybills: string[], reservedBy: string): Promise<any>;
  useWaybill(waybill: string, orderId: string, shipmentId: string): Promise<any>;
  cancelWaybill(waybill: string): Promise<any>;
}

type WaybillModel = mongoose.Model<IWaybill, {}, IWaybillMethods> & IWaybillStatics;

const waybillSchema = new mongoose.Schema({
  waybill: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['GENERATED', 'RESERVED', 'USED', 'CANCELLED'],
    default: 'GENERATED',
    index: true
  },
  source: {
    type: String,
    enum: ['DELHIVERY_BULK', 'DELHIVERY_SINGLE', 'DEMO'],
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  orderId: {
    type: String,
    default: null,
    index: true
  },
  shipmentId: {
    type: String,
    default: null,
    index: true
  },
  reservedBy: {
    type: String,
    default: null
  },
  reservedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'waybills'
});

// Indexes for efficient queries
waybillSchema.index({ status: 1, generatedAt: 1 });
waybillSchema.index({ source: 1, status: 1 });
waybillSchema.index({ orderId: 1, shipmentId: 1 });

// Static methods
waybillSchema.statics.getAvailableWaybills = function(count = 1, source = null) {
  const query: any = { status: 'GENERATED' };
  if (source) {
    query.source = source;
  }
  
  return this.find(query)
    .sort({ generatedAt: 1 })
    .limit(count);
};

waybillSchema.statics.reserveWaybills = function(waybills, reservedBy) {
  return this.updateMany(
    { waybill: { $in: waybills }, status: 'GENERATED' },
    { 
      status: 'RESERVED', 
      reservedBy,
      reservedAt: new Date()
    }
  );
};

waybillSchema.statics.useWaybill = function(waybill, orderId, shipmentId) {
  return this.updateOne(
    { waybill, status: { $in: ['GENERATED', 'RESERVED'] } },
    { 
      status: 'USED', 
      usedAt: new Date(),
      orderId,
      shipmentId
    }
  );
};

waybillSchema.statics.cancelWaybill = function(waybill) {
  return this.updateOne(
    { waybill },
    { 
      status: 'CANCELLED',
      usedAt: new Date()
    }
  );
};

// Instance methods
waybillSchema.methods.reserve = function(reservedBy: string) {
  this.status = 'RESERVED';
  this.reservedBy = reservedBy;
  this.reservedAt = new Date();
  return this.save();
};

waybillSchema.methods.use = function(orderId: string, shipmentId: string) {
  this.status = 'USED';
  this.usedAt = new Date();
  this.orderId = orderId;
  this.shipmentId = shipmentId;
  return this.save();
};

waybillSchema.methods.cancel = function() {
  this.status = 'CANCELLED';
  this.usedAt = new Date();
  return this.save();
};

const Waybill = (mongoose.models.Waybill as WaybillModel) || mongoose.model<IWaybill, WaybillModel>('Waybill', waybillSchema);

export default Waybill;
