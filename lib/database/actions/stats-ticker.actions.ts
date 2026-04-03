
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../connect";
import StatsTicker from "../models/stats-ticker.model";

/**
 * Get the active StatsTicker configuration
 */
export async function getStatsTickerData() {
    try {
        await connectToDatabase();

        let ticker = await StatsTicker.findOne({ isActive: true });

        // If no ticker exists, return a default one
        if (!ticker) {
            ticker = {
                items: [
                    { emoji: '🌿', label: 'Vegan & Cruelty-Free' },
                    { emoji: '💧', label: 'Long-Lasting Formula' },
                    { emoji: '🤝', label: 'Handcrafted In The USA' },
                    { emoji: '❌', label: 'Free Of Harmful Chemicals' },
                    { emoji: '🌍', label: 'Shipping Worldwide' },
                    { emoji: '⭐', label: 'Premium Quality' },
                    { emoji: '🎁', label: 'Exclusive Collections' },
                    { emoji: '✨', label: '100% Authentic Products' },
                ],
                backgroundColor: 'linear-gradient(90deg, #22c9a0 0%, #7c3aed 50%, #e879f9 100%)',
                speed: 28,
                isActive: true
            };
        }

        return {
            success: true,
            data: JSON.parse(JSON.stringify(ticker)),
        };
    } catch (error: any) {
        console.error("Error fetching stats ticker data:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch stats ticker data",
        };
    }
}

/**
 * Update or create StatsTicker configuration
 */
export async function updateStatsTickerData(data: any) {
    try {
        await connectToDatabase();

        let ticker = await StatsTicker.findOne();

        if (ticker) {
            // Update existing
            ticker = await StatsTicker.findByIdAndUpdate(
                ticker._id,
                { $set: data },
                { new: true }
            );
        } else {
            // Create new
            ticker = await StatsTicker.create(data);
        }

        revalidatePath("/");

        return {
            success: true,
            message: "Stats Ticker updated successfully",
            data: JSON.parse(JSON.stringify(ticker)),
        };
    } catch (error: any) {
        console.error("Error updating stats ticker data:", error);
        return {
            success: false,
            message: error.message || "Failed to update stats ticker data",
        };
    }
}
