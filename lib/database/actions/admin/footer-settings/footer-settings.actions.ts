"use server";

import { connectToDatabase } from "@/lib/database/connect";
import FooterSettings from "../../../models/footer.settings.model";
import { revalidatePath } from "next/cache";

// Get active footer settings
export async function getFooterSettings() {
  try {
    await connectToDatabase();
    
    let settings = await FooterSettings.findOne({ isActive: true });
    
    // If no settings exist at all, create default
    if (!settings) {
      settings = await FooterSettings.create({
        backgroundType: 'mesh',
        backgroundColorValue: '#111827',
        backgroundGradientValue: 'linear-gradient(to right, #111827, #1f2937)',
        blurOpacity: 40,
        textColor: '#ffffff',
        isActive: true
      });
    }

    return { 
      success: true, 
      settings: JSON.parse(JSON.stringify(settings)) 
    };
  } catch (error: any) {
    console.error("Error fetching footer settings:", error);
    return { success: false, message: error.message };
  }
}

// Update footer settings
export async function updateFooterSettings(data: any) {
  try {
    await connectToDatabase();

    const { id, ...updates } = data;
    
    let settings;
    if (id) {
      settings = await FooterSettings.findByIdAndUpdate(
        id,
        { ...updates },
        { new: true, runValidators: true }
      );
    } else {
      // Find active and update or create new
      settings = await FooterSettings.findOne({ isActive: true });
      if (settings) {
        settings = await FooterSettings.findByIdAndUpdate(
          settings._id,
          { ...updates },
          { new: true, runValidators: true }
        );
      } else {
        settings = await FooterSettings.create({ ...updates, isActive: true });
      }
    }

    return { 
      success: true, 
      settings: JSON.parse(JSON.stringify(settings)),
      message: "Footer settings updated successfully"
    };
  } catch (error: any) {
    console.error("Error updating footer settings:", error);
    return { success: false, message: error.message };
  }
}
