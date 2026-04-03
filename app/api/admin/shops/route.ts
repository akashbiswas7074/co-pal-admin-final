import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Shop from '@/lib/database/models/shop.model';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// Authentication check
async function checkAuthentication() {
  let isAuthenticated = false;

  try {
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      isAuthenticated = true;
    }
  } catch (error) {
    console.log("NextAuth session check failed:", error);
  }

  if (!isAuthenticated) {
    const cookieStore = cookies();
    const adminId = cookieStore.get('adminId')?.value;
    if (adminId) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
    isAuthenticated = true;
  }

  return isAuthenticated;
}

// GET - Fetch all shops
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const query = activeOnly ? { isActive: true } : {};
    const shops = await Shop.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      shops: JSON.parse(JSON.stringify(shops)),
      count: shops.length
    });
  } catch (error) {
    console.error("API Error fetching shops:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch shops"
    }, { status: 500 });
  }
}

// POST - Create new shop
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const data = await request.json();

    if (!data.name || !data.address || !data.latitude || !data.longitude) {
      return NextResponse.json(
        { success: false, message: "Name, address, and coordinates are required" },
        { status: 400 }
      );
    }

    const shop = await Shop.create(data);

    return NextResponse.json({
      success: true,
      message: "Shop created successfully",
      shop: JSON.parse(JSON.stringify(shop))
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { success: false, message: "Failed to create shop" },
      { status: 500 }
    );
  }
}
