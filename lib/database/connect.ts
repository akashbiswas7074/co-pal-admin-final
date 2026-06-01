import mongoose, { Mongoose } from "mongoose";

import "./models";

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

async function injectDbEnvVariables() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const settings = await db.collection("websitesettings").findOne({ isActive: true });
    if (settings) {
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

      for (const [key, value] of Object.entries(mappings)) {
        if (value !== undefined && value !== null && value !== "") {
          process.env[key] = String(value);
        }
      }
    }
  } catch (error) {
    console.error("Failed to inject DB env variables:", error);
  }
}

export const connectToDatabase = async () => {
  const MONGODB_URL = process.env.MONGODB_URL;
  console.log("Connecting to database with URL:", MONGODB_URL ? MONGODB_URL.substring(0, 30) + "..." : "undefined");
  try {
    if (cached.conn) {
      await injectDbEnvVariables();
      return cached.conn;
    }
    if (!MONGODB_URL) throw new Error("Missing MONGODB_URL");

    mongoose.set("strictQuery", false);

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URL, {
        dbName: "vibecart",
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;
    await injectDbEnvVariables();
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Clear broken cached promise
    throw error;
  }
};
