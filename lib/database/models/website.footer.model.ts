// filepath: /home/akashbiswas7797/Desktop/co-pal-ecom/co-pal-ecom-admin/lib/database/models/website.footer.model.ts
import mongoose, { Schema } from 'mongoose';

// Define the interface for website footer
export interface IWebsiteFooter {
  _id?: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  companyLinks: Array<{
    title: string;
    url: string;
  }>;
  shopLinks: Array<{
    title: string;
    url: string;
  }>;
  helpLinks: Array<{
    title: string;
    url: string;
  }>;
  policyLinks: Array<{
    title: string;
    url: string;
  }>;
  copyrightText: string;
  isActive: boolean;
  showFooterName: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Website Footer
const WebsiteFooterSchema = new Schema<IWebsiteFooter>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    contactInfo: {
      email: {
        type: String,
        required: [true, 'Email is required'],
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
    },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String,
      linkedin: String,
    },
    companyLinks: [{
      title: String,
      url: String,
    }],
    shopLinks: [{
      title: String,
      url: String,
    }],
    helpLinks: [{
      title: String,
      url: String,
    }],
    policyLinks: [{
      title: String,
      url: String,
    }],
    copyrightText: {
      type: String,
      required: [true, 'Copyright text is required'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    showFooterName: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Only one footer can be active at a time
WebsiteFooterSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const WebsiteFooter = mongoose.models.WebsiteFooter || mongoose.model<IWebsiteFooter>('WebsiteFooter', WebsiteFooterSchema);

// Ensure the schema has showFooterName or policyLinks if they were missing from a cached model
if (WebsiteFooter.schema) {
  if (!WebsiteFooter.schema.paths.showFooterName) {
    WebsiteFooter.schema.add({
      showFooterName: {
        type: Boolean,
        default: true,
      }
    });
  }
  if (!WebsiteFooter.schema.paths.policyLinks) {
    WebsiteFooter.schema.add({
      policyLinks: [{
        title: String,
        url: String,
      }]
    });
  }
}

export default WebsiteFooter;