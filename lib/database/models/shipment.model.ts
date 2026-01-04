import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const ShipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    waybillNumbers: [{
      type: String,
      required: true
    }],
    primaryWaybill: {
      type: String,
      required: true
    },
    shipmentType: {
      type: String,
      enum: ['FORWARD', 'REVERSE', 'MPS', 'REPLACEMENT'],
      required: true
    },
    status: {
      type: String,
      enum: ['Created', 'Manifested', 'In Transit', 'Delivered', 'Cancelled', 'RTO', 'Pending'],
      default: 'Created'
    },
    pickupLocation: {
      type: String,
      required: true
    },
    warehouse: {
      name: String,
      address: String,
      pincode: String,
      phone: String
    },
    customerDetails: {
      name: String,
      phone: String,
      address: String,
      pincode: String,
      city: String,
      state: String
    },
    packageDetails: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      productDescription: String,
      paymentMode: {
        type: String,
        enum: ['COD', 'Pre-paid', 'Pickup', 'REPL']
      },
      codAmount: Number
    },
    delhiveryResponse: {
      type: mongoose.Schema.Types.Mixed
    },
    pickupRequest: {
      pickup_date: String,
      pickup_time: String,
      pickup_location: String,
      expected_package_count: Number,
      pickup_id: String,
      response: mongoose.Schema.Types.Mixed
    },
    trackingInfo: {
      lastUpdated: Date,
      currentStatus: String,
      events: [{
        date: Date,
        status: String,
        location: String,
        description: String
      }]
    },
    labelGenerated: {
      type: Boolean,
      default: false
    },
    labelUrl: String,
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Additional indexes for faster queries
ShipmentSchema.index({ primaryWaybill: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ createdAt: -1 });

// Method to get formatted tracking info
ShipmentSchema.methods.getFormattedTrackingInfo = function() {
  return {
    waybill: this.primaryWaybill,
    status: this.status,
    lastUpdated: this.trackingInfo?.lastUpdated || this.updatedAt,
    events: this.trackingInfo?.events || []
  };
};

// Static method to find by waybill
ShipmentSchema.statics.findByWaybill = function(waybill: string) {
  return this.findOne({
    $or: [
      { primaryWaybill: waybill },
      { waybillNumbers: waybill }
    ]
  });
};

// Static method to get shipments by status
ShipmentSchema.statics.findByStatus = function(status: string) {
  return this.find({ status, isActive: true }).sort({ createdAt: -1 });
};

// Virtual for display name
ShipmentSchema.virtual('displayName').get(function() {
  return `${this.shipmentType}-${this.primaryWaybill}`;
});

const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", ShipmentSchema);

export default Shipment;
