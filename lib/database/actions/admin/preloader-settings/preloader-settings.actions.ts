'use server';

import { connectToDatabase } from "@/lib/database/connect";
import PreloaderSettings from "@/lib/database/models/preloader.settings.model";
import { revalidatePath } from "next/cache";

export async function getPreloaderSettings() {
  try {
    await connectToDatabase();

    let settings = await PreloaderSettings.findOne({ isActive: true });

    if (!settings) {
      settings = await PreloaderSettings.findOne(); // Fallback to any matching doc
    }
    
    if (!settings) {
      // Create default if none exists
      settings = await PreloaderSettings.create({
        logoUrl: "",
        isActive: false,
      });
    }

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings)),
    };
  } catch (error) {
    console.error("Error fetching preloader settings:", error);
    return {
      success: false,
      message: "Failed to fetch preloader settings.",
    };
  }
}

export async function updatePreloaderSettings(settingsData: any) {
  try {
    await connectToDatabase();

    const existingSettings = await PreloaderSettings.findOne({ isActive: true }) || await PreloaderSettings.findOne();

    if (existingSettings) {
      const updatedSettings = await PreloaderSettings.findByIdAndUpdate(
        existingSettings._id,
        { $set: settingsData },
        { new: true }
      );
      
      revalidatePath("/admin/dashboard/preloader-settings");
      return {
        success: true,
        message: "Settings updated successfully.",
        settings: JSON.parse(JSON.stringify(updatedSettings)),
      };
    } else {
      const newSettings = await PreloaderSettings.create({
        ...settingsData,
        isActive: true, // Force active for the first Document
      });

      revalidatePath("/admin/dashboard/preloader-settings");
      return {
        success: true,
        message: "Settings created successfully.",
        settings: JSON.parse(JSON.stringify(newSettings)),
      };
    }
  } catch (error) {
    console.error("Error updating preloader settings:", error);
    return {
      success: false,
      message: "Failed to update preloader settings.",
    };
  }
}
