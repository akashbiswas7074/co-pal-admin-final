"use server";

import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter, { IWebsiteFooter } from "@/lib/database/models/website.footer.model";

// Fetch all footer configurations for admin
export const fetchAllFooterConfigs = async () => {
  try {
    await connectToDatabase();
    const footerConfigs = await WebsiteFooter.find().sort({ updatedAt: -1 });
    return JSON.parse(JSON.stringify(footerConfigs));
  } catch (error: any) {
    console.error("Error fetching footer configurations:", error);
    return [];
  }
};

// Fetch the active footer configuration
export const fetchActiveFooterConfig = async () => {
  try {
    await connectToDatabase();
    const activeFooter = await WebsiteFooter.findOne({ isActive: true });
    return activeFooter ? JSON.parse(JSON.stringify(activeFooter)) : null;
  } catch (error: any) {
    console.error("Error fetching active footer configuration:", error);
    return null;
  }
};

// Create a new footer configuration
export const createFooterConfig = async (footerData: IWebsiteFooter) => {
  try {
    await connectToDatabase();

    // Validate required fields
    if (!footerData.contactInfo?.email || !footerData.contactInfo?.phone || !footerData.contactInfo?.address) {
      return {
        success: false,
        message: "Email, phone, and address are required fields in contactInfo",
      };
    }

    // Create new footer configuration
    const newFooterConfig = new WebsiteFooter({
      name: footerData.name,
      contactInfo: {
        email: footerData.contactInfo.email,
        phone: footerData.contactInfo.phone,
        address: footerData.contactInfo.address,
      },
      isActive: footerData.isActive || false,
      showFooterName: footerData.showFooterName !== undefined ? footerData.showFooterName : true,
      socialMedia: {
        facebook: footerData.socialMedia?.facebook || "",
        twitter: footerData.socialMedia?.twitter || "",
        instagram: footerData.socialMedia?.instagram || "",
        youtube: footerData.socialMedia?.youtube || "",
        linkedin: footerData.socialMedia?.linkedin || "",
      },
      companyLinks: footerData.companyLinks || [],
      shopLinks: footerData.shopLinks || [],
      helpLinks: footerData.helpLinks || [],
      copyrightText: footerData.copyrightText,
    });

    await newFooterConfig.save();

    return {
      success: true,
      message: "Footer configuration created successfully",
      footerConfig: JSON.parse(JSON.stringify(newFooterConfig)),
    };
  } catch (error: any) {
    console.error("Error creating footer configuration:", error);
    return {
      success: false,
      message: `Error creating footer configuration: ${error.message}`,
    };
  }
};

// Update an existing footer configuration
export const updateFooterConfig = async (id: string, footerData: Partial<IWebsiteFooter>) => {
  try {
    await connectToDatabase();

    const footerConfig = await WebsiteFooter.findById(id);

    if (!footerConfig) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }

    // Update fields
    if (footerData.name) footerConfig.name = footerData.name;
    if (footerData.copyrightText) footerConfig.copyrightText = footerData.copyrightText;
    if (footerData.contactInfo) {
      footerConfig.contactInfo = {
        ...footerConfig.contactInfo,
        ...footerData.contactInfo,
      };
    }
    if (footerData.isActive !== undefined) footerConfig.isActive = footerData.isActive;
    if (footerData.showFooterName !== undefined) footerConfig.showFooterName = footerData.showFooterName;

    // Update social media
    if (footerData.socialMedia) {
      footerConfig.socialMedia = {
        ...footerConfig.socialMedia,
        ...footerData.socialMedia,
      };
    }

    // Update link arrays
    if (footerData.companyLinks) footerConfig.companyLinks = footerData.companyLinks;
    if (footerData.shopLinks) footerConfig.shopLinks = footerData.shopLinks;
    if (footerData.helpLinks) footerConfig.helpLinks = footerData.helpLinks;

    await footerConfig.save();

    return {
      success: true,
      message: "Footer configuration updated successfully",
      footerConfig: JSON.parse(JSON.stringify(footerConfig)),
    };
  } catch (error: any) {
    console.error("Error updating footer configuration:", error);
    return {
      success: false,
      message: `Error updating footer configuration: ${error.message}`,
    };
  }
};

// Delete a footer configuration
export const deleteFooterConfig = async (id: string) => {
  try {
    await connectToDatabase();

    const result = await WebsiteFooter.findByIdAndDelete(id);

    if (!result) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }

    return {
      success: true,
      message: "Footer configuration deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting footer configuration:", error);
    return {
      success: false,
      message: `Error deleting footer configuration: ${error.message}`,
    };
  }
};

// Set a footer configuration as active
export const setFooterConfigActive = async (id: string) => {
  try {
    await connectToDatabase();

    const footerConfig = await WebsiteFooter.findById(id);

    if (!footerConfig) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }

    footerConfig.isActive = true;
    await footerConfig.save();

    return {
      success: true,
      message: "Footer configuration set as active successfully",
      footerConfig: JSON.parse(JSON.stringify(footerConfig)),
    };
  } catch (error: any) {
    console.error("Error setting footer configuration as active:", error);
    return {
      success: false,
      message: `Error setting footer configuration as active: ${error.message}`,
    };
  }
};