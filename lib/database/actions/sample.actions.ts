"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Sample from "@/lib/database/models/sample.model";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// CREATE
export async function createSample(sample: any) {
  try {
    await connectToDatabase();
    const newSample = await Sample.create(sample);
    revalidatePath("/admin/dashboard/samples");
    return JSON.parse(JSON.stringify(newSample));
  } catch (error) {
    console.log(error);
    throw new Error("Failed to create sample");
  }
}

// GET ALL
export async function getAllSamples() {
  try {
    await connectToDatabase();
    const samples = await Sample.find({}).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(samples));
  } catch (error) {
    console.log(error);
    return [];
  }
}

// GET BY ID
export async function getSampleById(sampleId: string) {
  try {
    await connectToDatabase();
    const sample = await Sample.findById(sampleId);
    return JSON.parse(JSON.stringify(sample));
  } catch (error) {
    console.log(error);
  }
}

// UPDATE
export async function updateSample(sampleId: string, sample: any) {
  try {
    await connectToDatabase();
    const updatedSample = await Sample.findByIdAndUpdate(sampleId, sample, {
      new: true,
    });
    revalidatePath("/admin/dashboard/samples");
    return JSON.parse(JSON.stringify(updatedSample));
  } catch (error) {
    console.log(error);
  }
}

// DELETE
export async function deleteSample(sampleId: string) {
  try {
    await connectToDatabase();
    const sample = await Sample.findById(sampleId);
    if (sample && sample.publicId) {
      await cloudinary.uploader.destroy(sample.publicId);
    }
    const deletedSample = await Sample.findByIdAndDelete(sampleId);
    revalidatePath("/admin/samples");
    return JSON.parse(JSON.stringify(deletedSample));
  } catch (error) {
    console.log(error);
  }
}
// GET BY PRODUCT ID
export async function getSamplesByProductId(productId: string) {
  try {
    await connectToDatabase();
    const samples = await Sample.find({ productId: productId });
    return JSON.parse(JSON.stringify(samples));
  } catch (error) {
    console.log(error);
    return [];
  }
}
