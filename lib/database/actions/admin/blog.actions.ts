"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Blog from "@/lib/database/models/blog.model";
import { revalidatePath } from "next/cache";

export const createBlog = async (data: any) => {
    try {
        await connectToDatabase();
        const newBlog = await Blog.create(data);
        revalidatePath("/");
        return { success: true, blog: JSON.parse(JSON.stringify(newBlog)) };
    } catch (error: any) {
        console.error("Error creating blog:", error);
        return { success: false, error: error.message };
    }
};

export const updateBlog = async (id: string, data: any) => {
    try {
        await connectToDatabase();
        const updatedBlog = await Blog.findByIdAndUpdate(id, data, { new: true });
        revalidatePath("/");
        return { success: true, blog: JSON.parse(JSON.stringify(updatedBlog)) };
    } catch (error: any) {
        console.error("Error updating blog:", error);
        return { success: false, error: error.message };
    }
};

export const deleteBlog = async (id: string) => {
    try {
        await connectToDatabase();
        await Blog.findByIdAndDelete(id);
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting blog:", error);
        return { success: false, error: error.message };
    }
};

export const getAllBlogs = async () => {
    try {
        await connectToDatabase();
        const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
        return JSON.parse(JSON.stringify(blogs));
    } catch (error: any) {
        console.error("Error fetching blogs:", error);
        return [];
    }
};
