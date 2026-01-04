// File: /home/akashbiswas7797/Desktop/vibecart-admin/co-pal-ecom-admin/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadPreset = formData.get('upload_preset') as string || 'website';

    if (!file) {
      console.error("API Route Error: No file provided in form data.");
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`API Route: Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const cloudName = process.env.CLOUDINARY_NAME;
    if (!cloudName) {
      console.error("API Route Error: CLOUDINARY_NAME not configured");
      return NextResponse.json(
        { error: 'Cloudinary cloud name not configured.' },
        { status: 500 }
      );
    }

    // Use unsigned upload via direct HTTP POST (no signature required)
    // This requires the upload_preset to be configured as "unsigned" in Cloudinary dashboard
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    // Create a new FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);
    cloudinaryFormData.append('folder', 'products');

    console.log(`API Route: Uploading to Cloudinary (unsigned) - cloud: ${cloudName}, preset: ${uploadPreset}`);

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('API Route Cloudinary Error:', errorData);

      // Check if it's an unsigned upload preset error
      if (errorData.error?.message?.includes('Upload preset')) {
        return NextResponse.json(
          { error: `Cloudinary upload preset '${uploadPreset}' must be configured as 'unsigned' in your Cloudinary dashboard. Go to Settings > Upload > Upload presets and set it to unsigned.` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Cloudinary upload failed' },
        { status: uploadResponse.status }
      );
    }

    const result = await uploadResponse.json();
    console.log("API Route: Cloudinary upload successful:", result.secure_url);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Route General Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during upload' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler for testing the route exists
export async function GET() {
  return NextResponse.json({ message: "Upload API route is active." });
}