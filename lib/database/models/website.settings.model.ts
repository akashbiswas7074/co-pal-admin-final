import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteSettings extends Document {
  _id: string;
  // SEO Meta Tags
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  defaultTitle: string;
  titleSeparator: string;
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType: string;
  
  // Twitter Card
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard: string;
  twitterSite?: string;
  twitterCreator?: string;
  
  // Favicons
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouchIcon?: string;
  androidChrome192?: string;
  androidChrome512?: string;
  safariPinnedTab?: string;
  msTileColor?: string;
  themeColor?: string;
  
  // Additional Meta Tags
  author?: string;
  robots?: string;
  canonical?: string;
  
  // Analytics & Tracking
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  
  // GST Configuration
  gstClientId?: string;
  gstClientSecret?: string;
  gstUsername?: string;
  gstPublicKey?: string;
  gstStateCd?: string;
  gstBaseUrl?: string;
  
  // Shipping Configuration
  freeShippingThreshold?: number;
  useWeightBasedShipping: boolean;
  stateShippingCharges?: {
    stateName: string;
    maxWeightGrams: number;
    charge: number;
  }[];
  
  // Payment Configuration
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  bypassPayment: boolean;
  // Schema.org
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType: string;
  
  // Status
  isActive: boolean;

  // Google OAuth
  googleClientId?: string;
  googleClientSecret?: string;

  // NextAuth
  nextAuthSecret?: string;
  nextAuthUrl?: string;

  // Nodemailer SMTP
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPassword?: string;
  emailFrom?: string;
  adminEmail?: string;
  companyName?: string;

  // Cloudinary
  cloudinaryName?: string;
  cloudinaryApiKey?: string;
  cloudinarySecret?: string;

  // Stripe
  stripeApiKey?: string;
  stripeSecretWebhook?: string;

  // SMS/Fast2SMS
  fast2smsApiKey?: string;
  dltTemplateId?: string;
  dltEntityId?: string;

  // Delhivery
  delhiveryApiToken?: string;
  delhiveryB2BUsername?: string;
  delhiveryB2BPassword?: string;
  warehousePincode?: string;

  // Zoho Books
  zohoClientId?: string;
  zohoClientSecret?: string;
  zohoRefreshToken?: string;
  zohoOrganizationId?: string;

  // Gemini API Keys
  geminiApiKey?: string;
  geminiApiKey2?: string;
  geminiApiKey3?: string;
  geminiApiKey4?: string;
  geminiApiKey5?: string;
  geminiApiKey6?: string;
  geminiApiKey7?: string;

  // GST Additions
  businessState?: string;
  businessGstin?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>({
  // SEO Meta Tags
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    maxlength: [100, 'Site name cannot exceed 100 characters']
  },
  siteDescription: {
    type: String,
    required: [true, 'Site description is required'],
    trim: true,
    maxlength: [160, 'Site description cannot exceed 160 characters']
  },
  siteKeywords: [{
    type: String,
    trim: true
  }],
  defaultTitle: {
    type: String,
    required: [true, 'Default title is required'],
    trim: true,
    maxlength: [60, 'Default title cannot exceed 60 characters']
  },
  titleSeparator: {
    type: String,
    default: ' | ',
    trim: true
  },
  
  // Open Graph
  ogTitle: {
    type: String,
    trim: true,
    maxlength: [40, 'OG title cannot exceed 40 characters']
  },
  ogDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'OG description cannot exceed 300 characters']
  },
  ogImage: {
    type: String,
    trim: true
  },
  ogType: {
    type: String,
    default: 'website',
    enum: ['website', 'article', 'product', 'profile']
  },
  
  // Twitter Card
  twitterTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'Twitter title cannot exceed 70 characters']
  },
  twitterDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Twitter description cannot exceed 200 characters']
  },
  twitterImage: {
    type: String,
    trim: true
  },
  twitterCard: {
    type: String,
    default: 'summary_large_image',
    enum: ['summary', 'summary_large_image', 'app', 'player']
  },
  twitterSite: {
    type: String,
    trim: true
  },
  twitterCreator: {
    type: String,
    trim: true
  },
  
  // Favicons
  favicon: String,
  favicon16: String,
  favicon32: String,
  appleTouchIcon: String,
  androidChrome192: String,
  androidChrome512: String,
  safariPinnedTab: String,
  msTileColor: {
    type: String,
    default: '#da532c'
  },
  themeColor: {
    type: String,
    default: '#ffffff'
  },
  
  // Additional Meta Tags
  author: String,
  robots: {
    type: String,
    default: 'index, follow'
  },
  canonical: String,
  
  // Analytics & Tracking
  googleAnalyticsId: String,
  googleTagManagerId: String,
  facebookPixelId: String,
  
  // GST Configuration
  gstClientId: {
    type: String,
    trim: true
  },
  gstClientSecret: {
    type: String,
    trim: true
  },
  gstUsername: {
    type: String,
    trim: true
  },
  gstPublicKey: {
    type: String,
    trim: true
  },
  gstStateCd: {
    type: String,
    default: '27'
  },
  gstBaseUrl: {
    type: String,
    default: 'https://api.gst.gov.in'
  },
  
  // Shipping Configuration
  freeShippingThreshold: {
    type: Number,
    default: 0
  },
  useWeightBasedShipping: {
    type: Boolean,
    default: false
  },
  stateShippingCharges: [{
    stateName: {
      type: String,
      required: true,
      trim: true
    },
    maxWeightGrams: {
      type: Number,
      required: true
    },
    charge: {
      type: Number,
      required: true
    }
  }],
  
  // Payment Configuration
  razorpayKeyId: {
    type: String,
    trim: true
  },
  razorpayKeySecret: {
    type: String,
    trim: true
  },
  razorpayWebhookSecret: {
    type: String,
    trim: true
  },
  bypassPayment: {
    type: Boolean,
    default: false
  },
  
  // Schema.org
  organizationName: String,
  organizationUrl: String,
  organizationLogo: String,
  organizationType: {
    type: String,
    default: 'Organization',
    enum: ['Organization', 'Corporation', 'EducationalOrganization', 'LocalBusiness', 'Store']
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Google OAuth
  googleClientId: { type: String, trim: true },
  googleClientSecret: { type: String, trim: true },

  // NextAuth
  nextAuthSecret: { type: String, trim: true },
  nextAuthUrl: { type: String, trim: true },

  // Nodemailer SMTP
  emailHost: { type: String, trim: true },
  emailPort: { type: Number },
  emailUser: { type: String, trim: true },
  emailPassword: { type: String, trim: true },
  emailFrom: { type: String, trim: true },
  adminEmail: { type: String, trim: true },
  companyName: { type: String, trim: true },

  // Cloudinary
  cloudinaryName: { type: String, trim: true },
  cloudinaryApiKey: { type: String, trim: true },
  cloudinarySecret: { type: String, trim: true },

  // Stripe
  stripeApiKey: { type: String, trim: true },
  stripeSecretWebhook: { type: String, trim: true },

  // SMS/Fast2SMS
  fast2smsApiKey: { type: String, trim: true },
  dltTemplateId: { type: String, trim: true },
  dltEntityId: { type: String, trim: true },

  // Delhivery
  delhiveryApiToken: { type: String, trim: true },
  delhiveryB2BUsername: { type: String, trim: true },
  delhiveryB2BPassword: { type: String, trim: true },
  warehousePincode: { type: String, trim: true },

  // Zoho Books
  zohoClientId: { type: String, trim: true },
  zohoClientSecret: { type: String, trim: true },
  zohoRefreshToken: { type: String, trim: true },
  zohoOrganizationId: { type: String, trim: true },

  // Gemini API Keys
  geminiApiKey: { type: String, trim: true },
  geminiApiKey2: { type: String, trim: true },
  geminiApiKey3: { type: String, trim: true },
  geminiApiKey4: { type: String, trim: true },
  geminiApiKey5: { type: String, trim: true },
  geminiApiKey6: { type: String, trim: true },
  geminiApiKey7: { type: String, trim: true },

  // GST Additions
  businessState: { type: String, trim: true },
  businessGstin: { type: String, trim: true }
}, {
  timestamps: true
});

// Indexes for better performance
WebsiteSettingsSchema.index({ isActive: 1 });
WebsiteSettingsSchema.index({ createdAt: -1 });

// Ensure only one active setting at a time
WebsiteSettingsSchema.pre('save', async function() {
  if (this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
});

// Force re-registration of the model if it exists but is missing new schema paths (useful for development)
if (mongoose.models.WebsiteSettings) {
  const schema = (mongoose.models.WebsiteSettings as any).schema;
  if (!schema.path('freeShippingThreshold') || !schema.path('googleClientId') || !schema.path('gstClientId') || !schema.path('razorpayKeyId') || !schema.path('bypassPayment') || !schema.path('useWeightBasedShipping')) {
    delete (mongoose.models as any).WebsiteSettings;
  }
}

const WebsiteSettings = mongoose.models.WebsiteSettings || mongoose.model<IWebsiteSettings>('WebsiteSettings', WebsiteSettingsSchema);

export default WebsiteSettings;