"use server";

import { connectToDatabase } from "../connect";
import Shop, { IShop } from "../models/shop.model";

/**
 * Get all shops
 */
export async function getAllShops() {
  try {
    await connectToDatabase();
    
    const shops = await Shop.find().sort({ createdAt: -1 });
    
    return {
      success: true,
      shops: JSON.parse(JSON.stringify(shops)),
    };
  } catch (error) {
    console.error("Error getting shops:", error);
    return {
      success: false,
      message: "Failed to get shops",
    };
  }
}

/**
 * Create a new shop
 */
export async function createShop(shopData: Partial<IShop>) {
  try {
    await connectToDatabase();
    
    const shop = await Shop.create(shopData);
    
    return {
      success: true,
      shop: JSON.parse(JSON.stringify(shop)),
      message: "Shop created successfully",
    };
  } catch (error) {
    console.error("Error creating shop:", error);
    return {
      success: false,
      message: "Failed to create shop",
    };
  }
}

/**
 * Update an existing shop
 */
export async function updateShop(id: string, shopData: Partial<IShop>) {
  try {
    await connectToDatabase();
    
    const shop = await Shop.findByIdAndUpdate(id, { $set: shopData }, { new: true });
    
    if (!shop) {
      return {
        success: false,
        message: "Shop not found",
      };
    }
    
    return {
      success: true,
      shop: JSON.parse(JSON.stringify(shop)),
      message: "Shop updated successfully",
    };
  } catch (error) {
    console.error("Error updating shop:", error);
    return {
      success: false,
      message: "Failed to update shop",
    };
  }
}

/**
 * Delete a shop
 */
export async function deleteShop(id: string) {
  try {
    await connectToDatabase();
    
    const shop = await Shop.findByIdAndDelete(id);
    
    if (!shop) {
      return {
        success: false,
        message: "Shop not found",
      };
    }
    
    return {
      success: true,
      message: "Shop deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting shop:", error);
    return {
      success: false,
      message: "Failed to delete shop",
    };
  }
}

/**
 * Toggle shop active status
 */
export async function toggleShopStatus(id: string) {
  try {
    await connectToDatabase();
    
    const shop = await Shop.findById(id);
    
    if (!shop) {
      return {
        success: false,
        message: "Shop not found",
      };
    }
    
    shop.isActive = !shop.isActive;
    await shop.save();
    
    return {
      success: true,
      shop: JSON.parse(JSON.stringify(shop)),
      message: `Shop ${shop.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error("Error toggling shop status:", error);
    return {
      success: false,
      message: "Failed to toggle shop status",
    };
  }
}
