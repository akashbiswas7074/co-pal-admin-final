import { Schema, model, models, Document } from "mongoose";

export interface IPreloaderSettings extends Document {
  logoUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PreloaderSettingsSchema = new Schema(
  {
    logoUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Delete the existing model to prevent OverwriteModelError during hot reloads
if (models.PreloaderSettings) {
  delete models.PreloaderSettings;
}

const PreloaderSettings = models.PreloaderSettings || model<IPreloaderSettings>("PreloaderSettings", PreloaderSettingsSchema);

export default PreloaderSettings;
