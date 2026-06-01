
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

        let ticker = await StatsTicker.findOne({ isActive: true }).lean();

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
            // Map items explicitly so iconColor/textColor survive Mongoose schema caching
            const sanitizedItems = (data.items || []).map((item: any) => ({
                emoji: item.emoji || '',
                label: item.label || '',
                iconColor: item.iconColor || '',
                textColor: item.textColor || '',
            }));

            // Use updateOne directly on the native collection to bypass schema cache
            await StatsTicker.collection.updateOne(
                { _id: ticker._id },
                {
                    $set: {
                        items: sanitizedItems,
                        backgroundColor: data.backgroundColor,
                        color1: data.color1,
                        color2: data.color2,
                        speed: data.speed,
                        isActive: data.isActive,
                        updatedAt: new Date(),
                    },
                }
            );

            // Re-fetch the updated document
            ticker = await StatsTicker.findById(ticker._id).lean();
        } else {
            // Create new with explicit item mapping
            const sanitizedItems = (data.items || []).map((item: any) => ({
                emoji: item.emoji || '',
                label: item.label || '',
                iconColor: item.iconColor || '',
                textColor: item.textColor || '',
            }));
            ticker = await StatsTicker.create({ ...data, items: sanitizedItems });
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
