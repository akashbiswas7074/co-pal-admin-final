import mongoose, { Schema, Document } from 'mongoose';

export interface IFooterSettings extends Document {
  backgroundType: 'solid' | 'gradient' | 'mesh' | 'blur';
  backgroundColorValue: string;
  backgroundGradientValue: string;
  blurOpacity: number;
  textColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FooterSettingsSchema = new Schema<IFooterSettings>({
  backgroundType: {
    type: String,
    enum: ['solid', 'gradient', 'mesh', 'blur'],
    default: 'mesh'
  },
  backgroundColorValue: {
    type: String,
    default: '#111827' // Default to a dark slate
  },
  backgroundGradientValue: {
    type: String,
    default: 'linear-gradient(to right, #111827, #1f2937)'
  },
  blurOpacity: {
    type: Number,
    default: 40,
    min: 0,
    max: 100
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure only one active setting exists
FooterSettingsSchema.pre('save', async function (next) {
  if (this.isActive) {
    // Avoid circular dependency issues by getting the model from the current constructor
    await (this.constructor as any).updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

// Delete cached model in development environment to ensure schema updates reflect
if (mongoose.models.FooterSettings) {
  delete mongoose.models.FooterSettings;
}

const FooterSettings = mongoose.model<IFooterSettings>('FooterSettings', FooterSettingsSchema);

export default FooterSettings;
