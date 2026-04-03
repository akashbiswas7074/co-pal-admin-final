import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IShop extends Document {
  name: string;
  address: string;
  phoneNumber: string;
  googleMapLink: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    googleMapLink: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Shop: Model<IShop> = models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;
