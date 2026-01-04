import { Document, Schema, model, models } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  registered_name?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pin: string;
  country?: string;
  return_address: string;
  return_city?: string;
  return_pin?: string;
  return_state?: string;
  return_country?: string;
  
  // Additional fields for tracking
  status: 'active' | 'inactive' | 'pending';
  delhiveryResponse?: any;
  createdBy?: string; // User ID who created this warehouse
  vendorId?: string; // For vendor-specific warehouses
  isDefault?: boolean; // Mark as default warehouse
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>({
  // Required fields
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  pin: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\d{6}$/.test(v);
      },
      message: 'Please provide a valid 6-digit pincode'
    }
  },
  return_address: {
    type: String,
    required: [true, 'Return address is required'],
    trim: true,
    maxlength: [500, 'Return address cannot exceed 500 characters']
  },

  // Optional fields
  registered_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Registered name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  country: {
    type: String,
    trim: true,
    default: 'India',
    maxlength: [50, 'Country name cannot exceed 50 characters']
  },
  return_city: {
    type: String,
    trim: true,
    maxlength: [50, 'Return city cannot exceed 50 characters']
  },
  return_pin: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\d{6}$/.test(v);
      },
      message: 'Please provide a valid 6-digit return pincode'
    }
  },
  return_state: {
    type: String,
    trim: true,
    maxlength: [50, 'Return state cannot exceed 50 characters']
  },
  return_country: {
    type: String,
    trim: true,
    default: 'India',
    maxlength: [50, 'Return country cannot exceed 50 characters']
  },

  // Tracking fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  delhiveryResponse: {
    type: Schema.Types.Mixed,
    default: null
  },
  createdBy: {
    type: String,
    trim: true
  },
  vendorId: {
    type: String,
    trim: true,
    index: true // Index for quick vendor lookups
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
WarehouseSchema.index({ name: 1, vendorId: 1 }, { unique: true }); // Unique warehouse name per vendor
WarehouseSchema.index({ pin: 1 });
WarehouseSchema.index({ status: 1 });
WarehouseSchema.index({ createdAt: -1 });

// Virtual for full address
WarehouseSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city, this.pin, this.country].filter(Boolean);
  return parts.join(', ');
});

// Virtual for return full address
WarehouseSchema.virtual('returnFullAddress').get(function() {
  const parts = [this.return_address, this.return_city, this.return_pin, this.return_state, this.return_country].filter(Boolean);
  return parts.join(', ');
});

// Pre-save middleware to ensure only one default warehouse per vendor
WarehouseSchema.pre('save', async function(next) {
  if (this.isDefault && this.vendorId) {
    // Remove default flag from other warehouses of the same vendor
    await (this.constructor as any).updateMany(
      { vendorId: this.vendorId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Static method to find warehouses by vendor
WarehouseSchema.statics.findByVendor = function(vendorId: string) {
  return this.find({ vendorId, status: 'active' }).sort({ createdAt: -1 });
};

// Static method to find default warehouse
WarehouseSchema.statics.findDefaultWarehouse = function(vendorId?: string) {
  const query: any = { isDefault: true, status: 'active' };
  if (vendorId) {
    query.vendorId = vendorId;
  }
  return this.findOne(query);
};

// Instance method to mark as default
WarehouseSchema.methods.setAsDefault = async function() {
  if (this.vendorId) {
    // Remove default flag from other warehouses
    await (this.constructor as any).updateMany(
      { vendorId: this.vendorId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  this.isDefault = true;
  return this.save();
};

const Warehouse = models?.Warehouse || model<IWarehouse>('Warehouse', WarehouseSchema);

export default Warehouse;
