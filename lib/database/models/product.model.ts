import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;
const reviewSchema = new mongoose.Schema({
  reviewBy: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  review: {
    type: String,
    required: true,
  },
  reviewCreatedAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
});
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    longDescription: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: ObjectId,
      required: true,
      ref: "Category",
    },
    subCategories: [
      {
        type: ObjectId,
        ref: "subCategory",
      },
    ],
    details: [
      {
        name: String,
        value: String,
      },
    ],
    // Tag values for the product
    tagValues: [
      {
        tag: {
          type: ObjectId,
          ref: "Tag",
        },
        value: String,
      },
    ],
    benefits: [{ name: String }],
    ingredients: [{ name: String }],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    vendor: {
      type: Object,
    },
    vendorId: {
      type: ObjectId,
      ref: "Vendor",
      required: false,
    },
    subProducts: [
      {
        sku: String,
        images: [],
        description_images: [],
        sizes: [
          {
            size: String,
            qty: Number,
            price: Number,
            sold: {
              type: Number,
              default: 0,
            },
          },
        ],
        discount: {
          type: Number,
          default: 0,
        },
        sold: {
          type: Number,
          default: 0,
        },
      },
    ],
    shippingDimensions: {
      length: {
        type: Number,
        default: 0,
      },
      breadth: {
        type: Number,
        default: 0,
      },
      height: {
        type: Number,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        default: 'cm/kg', // cm for dimensions, kg for weight
      },
    },
    featured: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
