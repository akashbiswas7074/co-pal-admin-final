import mongoose, { Schema, Document, models, model } from "mongoose";

// Interface for size chart entry
export interface ISizeChartEntry {
  size: string;
  chest?: string;
  waist?: string;
  hip?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  neck?: string;
  inseam?: string;
  [key: string]: string | undefined; // Allow additional measurements
}

// Interface for size chart category
export interface ISizeChart {
  categoryName: string;
  categoryId?: mongoose.Types.ObjectId; // Reference to category
  description?: string;
  measurements: ISizeChartEntry[];
  measurementUnits: string; // "inches", "cm", etc.
  isActive: boolean;
  order: number;
}

// Interface for size guide section
export interface ISizeGuideSection {
  title: string;
  content: string;
  icon: string;
  isActive: boolean;
  order: number;
}

// Interface for size guide document
export interface ISizeGuide extends Document {
  title: string;
  subtitle?: string;
  heroIcon?: string;
  sections: ISizeGuideSection[];
  sizeCharts: ISizeChart[];
  howToMeasure?: {
    enabled: boolean;
    content: string; // Rich text HTML content
    images?: string[];
  };
  fitTips?: {
    enabled: boolean;
    content: string; // Rich text HTML content
  };
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Size Chart Entry Schema
const SizeChartEntrySchema = new Schema<ISizeChartEntry>({
  size: {
    type: String,
    required: [true, "Size is required"],
    trim: true,
  },
  chest: { type: String, trim: true },
  waist: { type: String, trim: true },
  hip: { type: String, trim: true },
  length: { type: String, trim: true },
  shoulder: { type: String, trim: true },
  sleeve: { type: String, trim: true },
  neck: { type: String, trim: true },
  inseam: { type: String, trim: true },
}, { 
  _id: false,
  strict: false // Allow additional measurement fields
});

// Size Guide Section Schema
const SizeGuideSectionSchema = new Schema<ISizeGuideSection>({
  title: {
    type: String,
    required: [true, "Section title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Section content is required"],
  },
  icon: {
    type: String,
    default: "📏",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Size Chart Schema
const SizeChartSchema = new Schema<ISizeChart>({
  categoryName: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: false,
  },
  description: {
    type: String,
    trim: true,
  },
  measurements: [SizeChartEntrySchema],
  measurementUnits: {
    type: String,
    required: true,
    enum: ["inches", "cm"],
    default: "inches",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Size Guide Schema
const SizeGuideSchema = new Schema<ISizeGuide>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    default: "Size Guide",
  },
  subtitle: {
    type: String,
    trim: true,
    default: "Find your perfect fit",
  },
  heroIcon: {
    type: String,
    default: "📐",
  },
  sections: [SizeGuideSectionSchema],
  sizeCharts: [SizeChartSchema],
  howToMeasure: {
    enabled: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      default: "",
    },
    images: [{
      type: String,
      trim: true,
    }],
  },
  fitTips: {
    enabled: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      default: "",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  customCSS: {
    type: String,
    default: "",
  },
  lastUpdatedBy: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Only one size guide can be active at a time
SizeGuideSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const SizeGuide = models.SizeGuide || model<ISizeGuide>("SizeGuide", SizeGuideSchema);

export default SizeGuide;