import mongoose, { Schema } from 'mongoose';

// Define the interface for website logo
export interface IWebsiteLogo {
  _id?: string;
  name: string;
  logoUrl: string;
  altText: string;
  mobileLogoUrl?: string;
  authBackgroundUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Website Logo
const WebsiteLogoSchema = new Schema<IWebsiteLogo>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    logoUrl: {
      type: String,
      required: [true, 'Logo URL is required'],
    },
    altText: {
      type: String,
      required: [true, 'Alt text is required'],
    },
    mobileLogoUrl: {
      type: String,
    },
    authBackgroundUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Only one logo can be active at a time
WebsiteLogoSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && this.isActive) {
    await (this.constructor as mongoose.Model<IWebsiteLogo>).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Force refresh schema for Next.js dev server caching
delete mongoose.models.WebsiteLogo;

// Create and export the model
const WebsiteLogo = mongoose.models.WebsiteLogo || mongoose.model<IWebsiteLogo>('WebsiteLogo', WebsiteLogoSchema);

export default WebsiteLogo;