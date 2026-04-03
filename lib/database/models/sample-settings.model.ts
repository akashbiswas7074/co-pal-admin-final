import mongoose from "mongoose";

const sampleSettingsSchema = new mongoose.Schema(
  {
    bannerImage: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "Sample Packs",
    },
    subtitle: {
      type: String,
      default: "Try our exclusive fragrance samples before you buy the full bottle.",
    },
    titleColor: {
      type: String,
      default: "#ffffff",
    },
    subtitleColor: {
      type: String,
      default: "#ea580c",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one active setting
sampleSettingsSchema.pre("save", async function (next) {
  if (this.isActive) {
    await mongoose.models.SampleSettings.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

// Force deletion of the model if it exists to ensure schema updates take effect in dev
if (process.env.NODE_ENV !== 'production' && mongoose.models.SampleSettings) {
  delete mongoose.models.SampleSettings;
}

const SampleSettings = mongoose.models.SampleSettings || mongoose.model("SampleSettings", sampleSettingsSchema);
export default SampleSettings;
