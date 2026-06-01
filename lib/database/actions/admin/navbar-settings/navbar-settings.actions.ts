"use server";

import { connectToDatabase } from "@/lib/database/connect";
import NavbarSettings from "../../../models/navbar.settings.model";
import { revalidatePath } from "next/cache";

export async function getNavbarSettings() {
  try {
    await connectToDatabase();
    
    // There should only be one active setting
    let settings = await NavbarSettings.findOne({ isActive: true });
    
    // If no settings exist at all, create default
    if (!settings) {
      settings = await NavbarSettings.create({
        backgroundType: 'blur',
        backgroundColorValue: '#1a0a2c',
        backgroundGradientValue: 'linear-gradient(to right, #1a0a2c, #4a192c)',
        blurOpacity: 40,
        desktopLayout: 'inline',
        textColor: '#ffffff',
        isActive: true
      });
    }

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error getting navbar settings:", error);
    return {
      success: false,
      message: "Failed to get navbar settings",
      error: error.message
    };
  }
}

export async function updateNavbarSettings(data: any) {
  try {
    await connectToDatabase();

    const { id, ...updates } = data;
    
    let settings;
    if (id) {
      settings = await NavbarSettings.findByIdAndUpdate(
        id,
        { ...updates },
        { new: true, runValidators: true }
      );
    } else {
      settings = await NavbarSettings.create(updates);
    }

    revalidatePath("/admin/dashboard/navbar-settings");
    revalidatePath("/"); // Revalidate frontend if deployed similarly (depends on infra)

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings)),
      message: "Navbar settings updated successfully"
    };
  } catch (error: any) {
    console.error("Error updating navbar settings:", error);
    return {
      success: false,
      message: "Failed to update navbar settings",
      error: error.message
    };
  }
}
