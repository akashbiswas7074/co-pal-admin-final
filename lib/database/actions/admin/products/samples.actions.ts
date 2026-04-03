"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";
import SampleSettings from "@/lib/database/models/sample-settings.model";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export async function getProducts() {
  try {
    await connectToDatabase();
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(50).lean();

    const formattedProducts = products.map((p: any) => {
      const firstSubProduct = p.subProducts?.[0];
      const firstSize = firstSubProduct?.sizes?.[0];
      const rawImage = firstSubProduct?.images?.[0] || p.image || "";
      const image = typeof rawImage === "string" ? rawImage : (rawImage?.url || "");

      return {
        productId: p._id.toString(),
        name: p.name,
        sampleName: p.name,
        price: firstSize?.price || firstSubProduct?.price || 60,
        image,
      };
    });

    return JSON.parse(JSON.stringify(formattedProducts));
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getSampleSettings() {
  try {
    await connectToDatabase();
    let settings = await SampleSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await SampleSettings.create({
        bannerImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1920",
        title: "Sample Packs",
        subtitle: "Curate your own sample pack.",
        titleColor: "#ffffff",
        subtitleColor: "#ea580c"
      });
    } else if (!settings.titleColor || !settings.subtitleColor) {
      // Backfill color fields on old documents that predate the schema addition
      settings = await SampleSettings.findByIdAndUpdate(
        settings._id,
        {
          $set: {
            titleColor: settings.titleColor || "#ffffff",
            subtitleColor: settings.subtitleColor || "#ea580c",
          }
        },
        { new: true }
      );
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function updateSampleSettings(data: any) {
  try {
    await connectToDatabase();
    
    let settings = await SampleSettings.findOne();

    if (settings) {
      settings = await SampleSettings.findByIdAndUpdate(
        settings._id,
        { $set: {
          ...data,
          titleColor: data.titleColor || "#ffffff",
          subtitleColor: data.subtitleColor || "#ea580c",
        }},
        { new: true }
      );
    } else {
      settings = await SampleSettings.create({
        ...data,
        titleColor: data.titleColor || "#ffffff",
        subtitleColor: data.subtitleColor || "#ea580c",
      });
    }

    revalidatePath("/admin/dashboard/samples");
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update sample settings");
  }
}

export async function uploadSampleBanner(base64Image: string) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "samples",
    });
    return {
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}
