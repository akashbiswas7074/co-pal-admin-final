import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["MANDATORY_UNIVERSAL", "UNIVERSAL_OPTIONAL", "DEPENDENT_SUBCAT"],
      default: "UNIVERSAL_OPTIONAL", // Default type for backward compatibility
    },
    isMandatory: {
      type: Boolean,
      default: false,
      required: true,
    },
    subCategory: {
      type: ObjectId,
      ref: "SubCategory",
      required: true,
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

// Indexes
tagSchema.index({ subCategory: 1 });
tagSchema.index({ name: 1, subCategory: 1 }, { unique: true }); // Compound unique index: same name can exist for different subcategories
tagSchema.index({ isMandatory: 1 });

const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
export default Tag;
