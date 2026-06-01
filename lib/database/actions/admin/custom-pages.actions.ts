"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../../connect";
import CustomPage from "../../models/custom-page.model";

export async function createCustomPage(data: any) {
  try {
    await connectToDatabase();
    const newPage = await CustomPage.create(data);
    revalidatePath("/admin/dashboard/custom-pages");
    return { success: true, page: JSON.parse(JSON.stringify(newPage)) };
  } catch (error: any) {
    console.error("Error creating custom page:", error);
    return { success: false, message: error.message || "Failed to create page" };
  }
}

export async function updateCustomPage(id: string, data: any) {
  try {
    await connectToDatabase();
    const updatedPage = await CustomPage.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/admin/dashboard/custom-pages");
    // Also revalidate the public page
    if (updatedPage?.slug) {
      revalidatePath(`/page/${updatedPage.slug}`);
    }
    return { success: true, page: JSON.parse(JSON.stringify(updatedPage)) };
  } catch (error: any) {
    console.error("Error updating custom page:", error);
    return { success: false, message: error.message || "Failed to update page" };
  }
}

export async function deleteCustomPage(id: string) {
  try {
    await connectToDatabase();
    const deletedPage = await CustomPage.findByIdAndDelete(id);
    revalidatePath("/admin/dashboard/custom-pages");
    return { success: true, message: "Page deleted successfully" };
  } catch (error: any) {
    console.error("Error deleting custom page:", error);
    return { success: false, message: error.message || "Failed to delete page" };
  }
}

export async function getAllCustomPages() {
  try {
    await connectToDatabase();
    const pages = await CustomPage.find().sort({ createdAt: -1 });
    return { success: true, pages: JSON.parse(JSON.stringify(pages)) };
  } catch (error: any) {
    console.error("Error fetching custom pages:", error);
    return { success: false, message: "Failed to fetch pages" };
  }
}

export async function getCustomPageById(id: string) {
  try {
    await connectToDatabase();
    const page = await CustomPage.findById(id);
    return { success: true, page: JSON.parse(JSON.stringify(page)) };
  } catch (error: any) {
    console.error("Error fetching custom page by ID:", error);
    return { success: false, message: "Failed to fetch page" };
  }
}

export async function getCustomPageBySlug(slug: string) {
  try {
    await connectToDatabase();
    const page = await CustomPage.findOne({ slug, isActive: true });
    return { success: true, page: JSON.parse(JSON.stringify(page)) };
  } catch (error: any) {
    console.error("Error fetching custom page by slug:", error);
    return { success: false, message: "Failed to fetch page" };
  }
}
