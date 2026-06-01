"use server";

import { connectToDatabase } from "@/lib/database/connect";
import WebsiteSettings, { IWebsiteSettings } from "@/lib/database/models/website.settings.model";
import fs from 'fs';
import path from 'path';

// Helper function to sync DB settings to .env files
const syncEnvFile = (envPath: string, mappings: Record<string, any>) => {
  if (!fs.existsSync(envPath)) return;
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    let updated = false;

    for (const [key, value] of Object.entries(mappings)) {
      if (value === undefined || value === null || value === "") continue;
      
      let valueStr = String(value);
      if (valueStr.includes(' ') && !valueStr.startsWith('"')) {
        valueStr = `"${valueStr}"`;
      }

      // Escape special characters in key for regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedKey}\\s*=.*$`, 'm');

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${valueStr}`);
        updated = true;
      } else {
        envContent += `\n${key}=${valueStr}`;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`Successfully synchronized .env file at ${envPath}`);
    }
  } catch (err) {
    console.error(`Failed to sync .env file at ${envPath}:`, err);
  }
};

// Get active website settings
export const getActiveWebsiteSettings = async () => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOne({ isActive: true }).lean();
    
    return {
      success: true,
      settings: settings ? JSON.parse(JSON.stringify(settings)) : null
    };
  } catch (error: any) {
    console.error("Error fetching active website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch website settings"
    };
  }
};

// Get all website settings
export const getAllWebsiteSettings = async () => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error fetching all website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch website settings"
    };
  }
};

// Create or update website settings
export const createOrUpdateWebsiteSettings = async (data: Partial<IWebsiteSettings> & { _id?: string }) => {
  try {
    await connectToDatabase();
    
    let settings;
    const { _id, ...updateData } = data;

    if (_id) {
      // Update specific record and ensure it's active
      settings = await WebsiteSettings.findByIdAndUpdate(
        _id,
        { ...updateData, isActive: true },
        { new: true, runValidators: true }
      );
    } else {
      // Find active and update, or create new if none active
      settings = await WebsiteSettings.findOneAndUpdate(
        { isActive: true },
        { ...updateData, isActive: true },
        { 
          new: true, 
          upsert: true,
          runValidators: true
        }
      );
    }

    if (settings && settings.isActive) {
      // Deactivate all OTHER settings once we have a successfully saved active setting
      await WebsiteSettings.updateMany(
        { _id: { $ne: settings._id } }, 
        { isActive: false }
      );
      
      // Synchronize .env files for both frontend and backend
      const mappings: Record<string, any> = {
        GOOGLE_CLIENT_ID: settings.googleClientId,
        GOOGLE_CLIENT_SECRET: settings.googleClientSecret,
        NEXTAUTH_SECRET: settings.nextAuthSecret,
        NEXTAUTH_URL: settings.nextAuthUrl,
        EMAIL_SERVER_HOST: settings.emailHost,
        EMAIL_SERVER_PORT: settings.emailPort,
        EMAIL_SERVER_USER: settings.emailUser,
        EMAIL_SERVER_PASSWORD: settings.emailPassword,
        EMAIL_FROM: settings.emailFrom,
        ADMIN_EMAIL: settings.adminEmail,
        COMPANY_NAME: settings.companyName,
        CLOUDINARY_NAME: settings.cloudinaryName,
        CLOUDINARY_API_KEY: settings.cloudinaryApiKey,
        CLOUDINARY_SECRET: settings.cloudinarySecret,
        STRIPE_API_KEY: settings.stripeApiKey,
        STRIPE_SECRET_WEBHOOK: settings.stripeSecretWebhook,
        RAZORPAY_KEY_ID: settings.razorpayKeyId,
        RAZORPAY_KEY_SECRET: settings.razorpayKeySecret,
        RAZORPAY_WEBHOOK_SECRET: settings.razorpayWebhookSecret,
        FAST2SMS_API_KEY: settings.fast2smsApiKey,
        DLT_TEMPLATE_ID: settings.dltTemplateId,
        DLT_ENTITY_ID: settings.dltEntityId,
        DELHIVERY_API_TOKEN: settings.delhiveryApiToken,
        DELHIVERY_AUTH_TOKEN: settings.delhiveryApiToken,
        DELHIVERY_B2B_USERNAME: settings.delhiveryB2BUsername,
        DELHIVERY_B2B_PASSWORD: settings.delhiveryB2BPassword,
        NEXT_PUBLIC_WAREHOUSE_PINCODE: settings.warehousePincode,
        ZOHO_CLIENT_ID: settings.zohoClientId,
        ZOHO_CLIENT_SECRET: settings.zohoClientSecret,
        ZOHO_REFRESH_TOKEN: settings.zohoRefreshToken,
        ZOHO_ORGANIZATION_ID: settings.zohoOrganizationId,
        NEXT_PUBLIC_GEMINI_API_KEY: settings.geminiApiKey,
        NEXT_PUBLIC_GEMINI_API_KEY_2: settings.geminiApiKey2,
        NEXT_PUBLIC_GEMINI_API_KEY_3: settings.geminiApiKey3,
        NEXT_PUBLIC_GEMINI_API_KEY_4: settings.geminiApiKey4,
        NEXT_PUBLIC_GEMINI_API_KEY_5: settings.geminiApiKey5,
        NEXT_PUBLIC_GEMINI_API_KEY_6: settings.geminiApiKey6,
        NEXT_PUBLIC_GEMINI_API_KEY_7: settings.geminiApiKey7,
        GST_BASE_URL: settings.gstBaseUrl,
        GST_CLIENT_ID: settings.gstClientId,
        GST_CLIENT_SECRET: settings.gstClientSecret,
        GST_USERNAME: settings.gstUsername,
        GST_PUBLIC_KEY: settings.gstPublicKey,
        GST_STATE_CD: settings.gstStateCd,
        BUSINESS_STATE: settings.businessState,
        BUSINESS_GSTIN: settings.businessGstin,
      };

      const cwd = process.cwd();
      // Current is admin (.env)
      const adminEnvPath = path.join(cwd, '.env');
      // Parent/web is storefront (.env)
      const webEnvPath = path.join(cwd, '..', 'ecom-2-web', '.env');
      
      syncEnvFile(adminEnvPath, mappings);
      syncEnvFile(webEnvPath, mappings);
    }
    
    return {
      success: true,
      message: "Website settings saved successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error saving website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to save website settings"
    };
  }
};

// Update favicon settings specifically
export const updateFavicons = async (faviconData: {
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouchIcon?: string;
  androidChrome192?: string;
  androidChrome512?: string;
  safariPinnedTab?: string;
  msTileColor?: string;
  themeColor?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: faviconData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Favicon settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating favicon settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update favicon settings"
    };
  }
};

// Update SEO metadata specifically
export const updateSEOMetadata = async (seoData: {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string[];
  defaultTitle?: string;
  titleSeparator?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  robots?: string;
  canonical?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: seoData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "SEO metadata updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating SEO metadata:", error);
    return {
      success: false,
      message: error.message || "Failed to update SEO metadata"
    };
  }
};

// Update analytics and tracking settings
export const updateAnalyticsTracking = async (analyticsData: {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: analyticsData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Analytics settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating analytics settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update analytics settings"
    };
  }
};

// Update organization schema
export const updateOrganizationSchema = async (orgData: {
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: orgData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Organization schema updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating organization schema:", error);
    return {
      success: false,
      message: error.message || "Failed to update organization schema"
    };
  }
};

// Update GST configuration
export const updateGstSettings = async (gstData: {
  gstClientId?: string;
  gstClientSecret?: string;
  gstUsername?: string;
  gstPublicKey?: string;
  gstStateCd?: string;
  gstBaseUrl?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: gstData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "GST settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating GST settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update GST settings"
    };
  }
};

export const updateShippingSettings = async (shippingData: {
  freeShippingThreshold?: number;
  useWeightBasedShipping?: boolean;
  stateShippingCharges?: {
    stateName: string;
    maxWeightGrams: number;
    charge: number;
  }[];
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: shippingData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Shipping settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating shipping settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update shipping settings"
    };
  }
};

// Delete website settings
export const deleteWebsiteSettings = async (id: string) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findByIdAndDelete(id);
    
    if (!settings) {
      return {
        success: false,
        message: "Website settings not found"
      };
    }
    
    return {
      success: true,
      message: "Website settings deleted successfully"
    };
  } catch (error: any) {
    console.error("Error deleting website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to delete website settings"
    };
  }
};

// Activate specific website settings
export const activateWebsiteSettings = async (id: string) => {
  try {
    await connectToDatabase();
    
    // First, deactivate all settings
    await WebsiteSettings.updateMany({}, { isActive: false });
    
    // Then activate the specified settings
    const settings = await WebsiteSettings.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "Website settings not found"
      };
    }
    
    return {
      success: true,
      message: "Website settings activated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error activating website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to activate website settings"
    };
  }
};