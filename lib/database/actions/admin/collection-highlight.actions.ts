"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database/connect";
import CollectionHighlight from "@/lib/database/models/collection-highlight.model";

export async function getAllCollectionHighlights() {
    try {
        await connectToDatabase();
        const highlights = await CollectionHighlight.find().sort({ order: 1, createdAt: -1 });
        return {
            success: true,
            highlights: JSON.parse(JSON.stringify(highlights)),
        };
    } catch (error: any) {
        console.error("Error fetching highlights:", error);
        return { success: false, message: error.message };
    }
}

export async function getActiveCollectionHighlight() {
    try {
        await connectToDatabase();
        const highlight = await CollectionHighlight.findOne({ isActive: true }).sort({ order: 1 });
        return {
            success: true,
            highlight: highlight ? JSON.parse(JSON.stringify(highlight)) : null,
        };
    } catch (error: any) {
        console.error("Error fetching active highlight:", error);
        return { success: false, message: error.message };
    }
}

export async function createCollectionHighlight(data: any) {
    try {
        console.log("Creating New Collection Highlight");
        console.log("Data received for creation:", JSON.stringify(data, null, 2));
        await connectToDatabase();
        const newHighlight = await CollectionHighlight.create(data);
        console.log("New highlight created in DB:", JSON.stringify(newHighlight, null, 2));
        revalidatePath("/");
        revalidatePath("/admin/dashboard/collection-highlights");
        return {
            success: true,
            message: "Collection Highlight created successfully",
            highlight: JSON.parse(JSON.stringify(newHighlight)),
        };
    } catch (error: any) {
        console.error("Error creating highlight:", error);
        return { success: false, message: error.message };
    }
}

export async function updateCollectionHighlight(id: string, data: any) {
    try {
        console.log("Updating Collection Highlight:", id);
        console.log("Data received for update:", JSON.stringify(data, null, 2));
        await connectToDatabase();
        const updatedHighlight = await CollectionHighlight.findByIdAndUpdate(id, data, { new: true });
        console.log("Updated highlight from DB:", JSON.stringify(updatedHighlight, null, 2));
        revalidatePath("/");
        revalidatePath("/admin/dashboard/collection-highlights");
        return {
            success: true,
            message: "Collection Highlight updated successfully",
            highlight: JSON.parse(JSON.stringify(updatedHighlight)),
        };
    } catch (error: any) {
        console.error("Error updating highlight:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteCollectionHighlight(id: string) {
    try {
        await connectToDatabase();
        await CollectionHighlight.findByIdAndDelete(id);
        revalidatePath("/");
        revalidatePath("/admin/dashboard/collection-highlights");
        return {
            success: true,
            message: "Collection Highlight deleted successfully",
        };
    } catch (error: any) {
        console.error("Error deleting highlight:", error);
        return { success: false, message: error.message };
    }
}
