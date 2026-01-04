"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Tag from "@/lib/database/models/tag.model";
import mongoose from "mongoose";

// Create a tag
export const createTag = async (
  name: string,
  subCategoryId: string,
  isMandatory: boolean
) => {
  try {
    await connectToDatabase();
    
    if (!name || !name.trim()) {
      return {
        success: false,
        message: "Tag name is required.",
      };
    }
    
    if (!subCategoryId) {
      return {
        success: false,
        message: "Sub-category ID is required.",
      };
    }
    
    // Ensure subCategoryId is a valid ObjectId
    let validSubCategoryId = subCategoryId;
    if (typeof subCategoryId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
        return {
          success: false,
          message: "Invalid sub-category ID format.",
        };
      }
      validSubCategoryId = new mongoose.Types.ObjectId(subCategoryId);
    }
    
    console.log(`Creating tag: name="${name.trim()}", subCategoryId="${validSubCategoryId}", isMandatory=${isMandatory}`);
    
    // Check if tag with same name already exists for this sub-category
    const existingTag = await Tag.findOne({
      name: name.trim(),
      subCategory: validSubCategoryId,
      isActive: true,
    });
    
    if (existingTag) {
      console.log(`Tag "${name}" already exists for sub-category ${subCategoryId}`);
      return {
        success: true, // Return success since tag already exists
        message: `Tag "${name}" already exists for this sub-category.`,
        tag: JSON.parse(JSON.stringify(existingTag)),
      };
    }
    
    // Determine type based on isMandatory
    const tagType = isMandatory ? "MANDATORY_UNIVERSAL" : "UNIVERSAL_OPTIONAL";
    
    let tag;
    try {
      tag = await new Tag({
        name: name.trim(),
        type: tagType,
        subCategory: validSubCategoryId,
        isMandatory: Boolean(isMandatory), // Ensure isMandatory is always a boolean
        isActive: true,
      }).save();
    } catch (error: any) {
      // Handle duplicate key error (E11000)
      if (error.code === 11000) {
        console.log(`Duplicate key error for tag "${name}" - checking if it exists...`);
        
        // Check if tag exists for this subcategory
        const duplicateTag = await Tag.findOne({
          name: name.trim(),
          subCategory: validSubCategoryId,
        });
        
        if (duplicateTag) {
          console.log(`Tag "${name}" already exists for this sub-category`);
          return {
            success: true,
            message: `Tag "${name}" already exists for this sub-category.`,
            tag: JSON.parse(JSON.stringify(duplicateTag)),
          };
        }
        
        // If we get here, it means the old unique index on 'name' is blocking us
        // Try to find if tag exists for a different subcategory
        const tagWithSameName = await Tag.findOne({
          name: name.trim(),
        });
        
        if (tagWithSameName) {
          // Tag exists for a different subcategory - this should be allowed
          // The error is due to old unique index on 'name' only
          console.log(`Tag "${name}" exists for another sub-category - this should be allowed`);
          
          // Try to automatically fix the index
          try {
            const { fixTagIndex } = await import("./fix-tag-index.actions");
            const fixResult = await fixTagIndex();
            
            if (fixResult.success) {
              console.log("Index fixed successfully, retrying tag creation...");
              // Retry creating the tag after fixing the index
              try {
                const retryTag = await new Tag({
                  name: name.trim(),
                  type: tagType,
                  subCategory: validSubCategoryId,
                  isMandatory: Boolean(isMandatory),
                  isActive: true,
                }).save();
                
                return {
                  success: true,
                  message: `Tag "${name}" created successfully after fixing database index.`,
                  tag: JSON.parse(JSON.stringify(retryTag)),
                };
              } catch (retryError: any) {
                return {
                  success: false,
                  message: `Index fixed but tag creation still failed: ${retryError.message}`,
                };
              }
            } else {
              return {
                success: false,
                message: `Tag "${name}" exists for another sub-category. Could not automatically fix index: ${fixResult.message}. Please run the fix manually in MongoDB.`,
              };
            }
          } catch (fixError: any) {
            console.error("Error trying to fix index:", fixError);
            return {
              success: false,
              message: `Tag "${name}" exists for another sub-category. Please fix the database index manually: db.tags.dropIndex("name_1") then db.tags.createIndex({ name: 1, subCategory: 1 }, { unique: true })`,
            };
          }
        }
        
        // Unknown duplicate key error
        console.error(`Unexpected duplicate key error for tag "${name}"`);
        return {
          success: false,
          message: `Error creating tag: Duplicate key error. Please check the database indexes.`,
        };
      }
      // Re-throw if it's not a duplicate key error
      throw error;
    }
    
    console.log(`Tag created successfully:`, tag._id);
    console.log(`Tag subCategory value:`, tag.subCategory);
    console.log(`Tag subCategory type:`, typeof tag.subCategory);
    console.log(`Tag subCategory toString:`, tag.subCategory?.toString());
    
    // Verify the tag was saved correctly by fetching it back
    const verifyTag = await Tag.findById(tag._id).lean();
    console.log(`Verified tag subCategory:`, verifyTag?.subCategory);
    
    return {
      success: true,
      message: `Tag "${name}" created successfully.`,
      tag: JSON.parse(JSON.stringify(tag)),
    };
  } catch (error: any) {
    console.error("Error creating tag:", error);
    return {
      success: false,
      message: `Error creating tag: ${error.message}`,
    };
  }
};

// Get all tags for a sub-category
export const getTagsBySubCategory = async (subCategoryId: string) => {
  try {
    await connectToDatabase();
    
    // Ensure subCategoryId is a valid ObjectId
    let validSubCategoryId = subCategoryId;
    if (typeof subCategoryId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
        console.error("Invalid sub-category ID format:", subCategoryId);
        return {
          success: false,
          tags: [],
          message: "Invalid sub-category ID format.",
        };
      }
      validSubCategoryId = new mongoose.Types.ObjectId(subCategoryId);
    }
    
    console.log(`Fetching tags for sub-category: ${validSubCategoryId} (original: ${subCategoryId})`);
    
    // Debug: Check what's actually in the database
    const allTags = await Tag.find({ isActive: true }).limit(10).lean();
    console.log(`Total active tags in database: ${allTags.length}`);
    if (allTags.length > 0) {
      console.log(`Sample tag subCategory value:`, allTags[0].subCategory);
      console.log(`Sample tag subCategory type:`, typeof allTags[0].subCategory);
      console.log(`Sample tag subCategory toString:`, allTags[0].subCategory?.toString());
      console.log(`Looking for:`, validSubCategoryId.toString());
      console.log(`Looking for (string):`, subCategoryId);
    }
    
    // Try querying with ObjectId first
    let tags = await Tag.find({
      subCategory: validSubCategoryId,
      isActive: true,
    })
      .sort({ isMandatory: -1, name: 1 })
      .lean();
    
    console.log(`Found ${tags.length} tags with ObjectId query`);
    
    // If no results, try with string
    if (tags.length === 0) {
      console.log("Trying string format query...");
      tags = await Tag.find({
        subCategory: subCategoryId,
        isActive: true,
      })
        .sort({ isMandatory: -1, name: 1 })
        .lean();
      console.log(`Found ${tags.length} tags with string query`);
    }
    
    // If still no results, try with $or query covering all formats
    if (tags.length === 0) {
      console.log("Trying $or query with multiple formats...");
      tags = await Tag.find({
        $or: [
          { subCategory: validSubCategoryId },
          { subCategory: subCategoryId },
          { subCategory: subCategoryId.toString() },
        ],
        isActive: true,
      })
        .sort({ isMandatory: -1, name: 1 })
        .lean();
      console.log(`Found ${tags.length} tags with $or query`);
    }
    
    console.log(`Final result: Found ${tags.length} tags for sub-category ${subCategoryId}`);
    
    return {
      success: true,
      tags: JSON.parse(JSON.stringify(tags)),
    };
  } catch (error: any) {
    console.error("Error fetching tags by sub-category:", error);
    return {
      success: false,
      tags: [],
      message: `Error fetching tags: ${error.message}`,
    };
  }
};

// Get all tags for a category (by getting all sub-categories' tags)
export const getTagsByCategory = async (categoryId: string) => {
  try {
    await connectToDatabase();
    const SubCategory = (await import("@/lib/database/models/subCategory.model")).default;
    
    // Get all sub-categories for this category
    const subCategories = await SubCategory.find({ parent: categoryId }).select("_id");
    const subCategoryIds = subCategories.map((sc) => sc._id);
    
    console.log(`Fetching tags for category ${categoryId}, found ${subCategoryIds.length} sub-categories`);
    
    if (subCategoryIds.length === 0) {
      console.log("No sub-categories found for this category");
      return {
        success: true,
        tags: [],
        message: "No sub-categories found for this category",
      };
    }
    
    // Get all tags for these sub-categories
    const allTags = await Tag.find({
      subCategory: { $in: subCategoryIds },
      isActive: true,
    })
      .sort({ isMandatory: -1, name: 1 })
      .lean();
    
    console.log(`Found ${allTags.length} tags for category ${categoryId}`);
    
    // Group tags by normalized name (case-insensitive) to merge duplicates
    const tagMap: Map<string, any> = new Map();
    allTags.forEach((tag: any) => {
      const normalizedName = tag.name?.trim().toLowerCase() || '';
      if (normalizedName) {
        // If tag with same normalized name exists, keep the first one (prefer mandatory)
        if (!tagMap.has(normalizedName)) {
          tagMap.set(normalizedName, tag);
        } else {
          // If current tag is mandatory and existing is not, replace it
          const existingTag = tagMap.get(normalizedName);
          if (tag.isMandatory && !existingTag.isMandatory) {
            tagMap.set(normalizedName, tag);
          }
        }
      }
    });
    
    const uniqueTags = Array.from(tagMap.values());
    console.log(`After deduplication: ${uniqueTags.length} unique tags`);
    
    return {
      success: true,
      tags: JSON.parse(JSON.stringify(uniqueTags)),
    };
  } catch (error: any) {
    console.error("Error in getTagsByCategory:", error);
    return {
      success: false,
      tags: [],
      message: `Error fetching tags: ${error.message}`,
    };
  }
};

// Get all tags
export const getAllTags = async () => {
  try {
    await connectToDatabase();
    const tags = await Tag.find({ isActive: true })
      .populate("subCategory", "name")
      .sort({ subCategory: 1, isMandatory: -1, name: 1 })
      .lean();
    
    return {
      success: true,
      tags: JSON.parse(JSON.stringify(tags)),
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      tags: [],
      message: `Error fetching tags: ${error.message}`,
    };
  }
};

// Update a tag
export const updateTag = async (
  tagId: string,
  name?: string,
  isMandatory?: boolean
) => {
  try {
    await connectToDatabase();
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isMandatory !== undefined) {
      updateData.isMandatory = Boolean(isMandatory);
      // Also update type field based on isMandatory
      updateData.type = isMandatory ? "MANDATORY_UNIVERSAL" : "UNIVERSAL_OPTIONAL";
    }
    
    const tag = await Tag.findByIdAndUpdate(tagId, updateData, { new: true });
    
    if (!tag) {
      return {
        success: false,
        message: "Tag not found.",
      };
    }
    
    return {
      success: true,
      message: "Tag updated successfully.",
      tag: JSON.parse(JSON.stringify(tag)),
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: `Error updating tag: ${error.message}`,
    };
  }
};

// Delete a tag
export const deleteTag = async (tagId: string) => {
  try {
    await connectToDatabase();
    const tag = await Tag.findByIdAndUpdate(
      tagId,
      { isActive: false },
      { new: true }
    );
    
    if (!tag) {
      return {
        success: false,
        message: "Tag not found.",
      };
    }
    
    return {
      success: true,
      message: "Tag deleted successfully.",
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: `Error deleting tag: ${error.message}`,
    };
  }
};
