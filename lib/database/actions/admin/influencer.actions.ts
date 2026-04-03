"use server";

import { connectToDatabase } from "@/lib/database/connect";
import InfluencerSpotlight from "@/lib/database/models/influencer-spotlight.model";
import { revalidatePath } from "next/cache";

export const createInfluencer = async (data: any) => {
    try {
        await connectToDatabase();
        const newInfluencer = await InfluencerSpotlight.create(data);
        revalidatePath("/");
        return { success: true, influencer: JSON.parse(JSON.stringify(newInfluencer)) };
    } catch (error: any) {
        console.error("Error creating influencer spotlight:", error);
        return { success: false, error: error.message };
    }
};

export const updateInfluencer = async (id: string, data: any) => {
    try {
        await connectToDatabase();
        const updatedInfluencer = await InfluencerSpotlight.findByIdAndUpdate(id, data, { new: true });
        revalidatePath("/");
        return { success: true, influencer: JSON.parse(JSON.stringify(updatedInfluencer)) };
    } catch (error: any) {
        console.error("Error updating influencer spotlight:", error);
        return { success: false, error: error.message };
    }
};

export const deleteInfluencer = async (id: string) => {
    try {
        await connectToDatabase();
        await InfluencerSpotlight.findByIdAndDelete(id);
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting influencer spotlight:", error);
        return { success: false, error: error.message };
    }
};

export const getAllInfluencers = async () => {
    try {
        await connectToDatabase();
        const influencers = await InfluencerSpotlight.find().sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(influencers));
    } catch (error: any) {
        console.error("Error fetching influencer spotlights:", error);
        return [];
    }
};
