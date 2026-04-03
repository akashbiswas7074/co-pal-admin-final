import mongoose from "mongoose";

const sampleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    discount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    productId: {
      type: String,
      default: "",
    },
    variant: {
      type: String,
      default: "5ml",
    },
    value: {
      type: Number,
    },
    unit: {
      type: String,
    },
    publicId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Force deletion of the model if it exists to ensure schema updates
if (process.env.NODE_ENV !== 'production' && mongoose.models.Sample) {
  delete mongoose.models.Sample;
}

const Sample = mongoose.models.Sample || mongoose.model("Sample", sampleSchema);
export default Sample;
