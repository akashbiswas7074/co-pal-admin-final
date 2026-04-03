"use server";

import { connectToDatabase } from "@/lib/database/connect";
import FeaturedReview from "@/lib/database/models/featured-review.model";
import { revalidatePath } from "next/cache";

export const createFeaturedReview = async (data: any) => {
    try {
        await connectToDatabase();
        const newReview = await FeaturedReview.create(data);
        revalidatePath("/");
        return { success: true, review: JSON.parse(JSON.stringify(newReview)) };
    } catch (error: any) {
        console.error("Error creating featured review:", error);
        return { success: false, error: error.message };
    }
};

export const updateFeaturedReview = async (id: string, data: any) => {
    try {
        await connectToDatabase();
        const updatedReview = await FeaturedReview.findByIdAndUpdate(id, data, { new: true });
        revalidatePath("/");
        return { success: true, review: JSON.parse(JSON.stringify(updatedReview)) };
    } catch (error: any) {
        console.error("Error updating featured review:", error);
        return { success: false, error: error.message };
    }
};

export const deleteFeaturedReview = async (id: string) => {
    try {
        await connectToDatabase();
        await FeaturedReview.findByIdAndDelete(id);
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting featured review:", error);
        return { success: false, error: error.message };
    }
};

export const getAllFeaturedReviews = async () => {
    try {
        await connectToDatabase();
        const reviews = await FeaturedReview.find().sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(reviews));
    } catch (error: any) {
        console.error("Error fetching featured reviews:", error);
        return [];
    }
};
