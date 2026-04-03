import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Clear all admin-related cookies
    const cookieStore = await cookies();
    cookieStore.delete("adminId");
    cookieStore.delete("adminToken");
    
    // Clear NextAuth session cookie if it exists
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    
    return NextResponse.json({
      success: true,
      message: "Admin logged out successfully"
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 500 }
    );
  }
}
