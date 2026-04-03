"use server";

import { connectToDatabase } from "@/lib/database/connect";
import CategorySizeGuide from "@/lib/database/models/category-size-guide.model";

/**
 * Get all category size guides
 */
export async function getAllCategorySizeGuides() {
    try {
        await connectToDatabase();
        const sizeGuides = await CategorySizeGuide.find({ isActive: true })
            .sort({ category: 1, subCategory: 1 })
            .lean();

        return {
            success: true,
            sizeGuides: JSON.parse(JSON.stringify(sizeGuides)),
        };
    } catch (error: any) {
        console.error("Error fetching category size guides:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch size guides",
            sizeGuides: [],
        };
    }
}

/**
 * Get size guide by category and subcategory
 */
export async function getCategorySizeGuide(category: string, subCategory: string) {
    try {
        await connectToDatabase();
        const sizeGuide = await CategorySizeGuide.findOne({
            category,
            subCategory,
            isActive: true,
        }).lean();

        return {
            success: true,
            sizeGuide: sizeGuide ? JSON.parse(JSON.stringify(sizeGuide)) : null,
        };
    } catch (error: any) {
        console.error("Error fetching category size guide:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch size guide",
            sizeGuide: null,
        };
    }
}

/**
 * Create or update category size guide (upsert)
 */
export async function upsertCategorySizeGuide(data: {
    category: string;
    subCategory: string;
    title?: string;
    htmlContent: string;
}) {
    try {
        await connectToDatabase();

        const sizeGuide = await CategorySizeGuide.findOneAndUpdate(
            {
                category: data.category,
                subCategory: data.subCategory,
            },
            {
                $set: {
                    title: data.title || 'Size Guide',
                    htmlContent: data.htmlContent,
                    isActive: true,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        ).lean();

        return {
            success: true,
            message: "Size guide saved successfully",
            sizeGuide: JSON.parse(JSON.stringify(sizeGuide)),
        };
    } catch (error: any) {
        console.error("Error upserting category size guide:", error);
        return {
            success: false,
            error: error.message || "Failed to save size guide",
        };
    }
}

/**
 * Delete a category size guide
 */
export async function deleteCategorySizeGuide(id: string) {
    try {
        await connectToDatabase();

        const sizeGuide = await CategorySizeGuide.findByIdAndDelete(id);

        if (!sizeGuide) {
            return {
                success: false,
                error: "Size guide not found",
            };
        }

        return {
            success: true,
            message: "Size guide deleted successfully",
        };
    } catch (error: any) {
        console.error("Error deleting category size guide:", error);
        return {
            success: false,
            error: error.message || "Failed to delete size guide",
        };
    }
}
