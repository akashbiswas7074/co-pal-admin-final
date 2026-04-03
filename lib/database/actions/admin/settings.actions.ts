"use server";

/**
 * Server action to fetch business-related settings for the invoice
 */
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

export const getBusinessDetails = async () => {
    try {
        await connectToDatabase();

        // Fetch active logo and footer settings
        const logoSettings = await WebsiteLogo.findOne({ isActive: true }).lean() as any;
        const footerSettings = await WebsiteFooter.findOne({ isActive: true }).lean() as any;

        return {
            logoUrl: logoSettings?.logoUrl || null,
            businessName: footerSettings?.name || process.env.BUSINESS_NAME || "NOFAME",
            businessAddress: footerSettings?.contactInfo?.address || process.env.BUSINESS_ADDRESS || "123 Fashion Street, Mumbai, Maharashtra - 400001",
            businessEmail: footerSettings?.contactInfo?.email || process.env.BUSINESS_EMAIL || "",
            businessPhone: footerSettings?.contactInfo?.phone || process.env.BUSINESS_PHONE || "",
            // Still rely on env for GST details if not in DB models yet
            businessGstin: process.env.BUSINESS_GSTIN || "27AABCU9603R1ZN",
            businessState: process.env.BUSINESS_STATE || "Maharashtra",
            businessStateCd: process.env.BUSINESS_STATE_CD || "27"
        };
    } catch (error) {
        console.error("Error fetching business details:", error);
        return {
            logoUrl: null,
            businessName: process.env.BUSINESS_NAME || "NOFAME",
            businessGstin: process.env.BUSINESS_GSTIN || "27AABCU9603R1ZN",
            businessAddress: process.env.BUSINESS_ADDRESS || "123 Fashion Street, Mumbai, Maharashtra - 400001",
            businessState: process.env.BUSINESS_STATE || "Maharashtra",
            businessStateCd: process.env.BUSINESS_STATE_CD || "27",
            businessEmail: "",
            businessPhone: ""
        };
    }
};
