"use server";

import { connectToDatabase } from "@/lib/database/connect";
import mongoose from "mongoose";

/**
 * Fix the tag collection index by removing old unique index on 'name'
 * and creating compound unique index on 'name' and 'subCategory'
 */
export const fixTagIndex = async () => {
  try {
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    if (!db) {
      return {
        success: false,
        message: "Database connection not available",
      };
    }

    const collection = db.collection("tags");

    // Get all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);

    // Check if old unique index on 'name' exists
    const nameIndex = indexes.find(
      (idx: any) =>
        idx.key &&
        idx.key.name === 1 &&
        idx.unique === true &&
        !idx.key.subCategory
    );

    if (nameIndex) {
      console.log('Found old unique index on "name", dropping it...');
      try {
        await collection.dropIndex("name_1");
        console.log('Successfully dropped old index on "name"');
      } catch (error: any) {
        // Index might have a different name
        if (error.codeName === "IndexNotFound") {
          console.log("Index 'name_1' not found, trying to find by key pattern...");
          // Try to find and drop by key pattern
          const indexToDrop = indexes.find(
            (idx: any) => idx.key && idx.key.name === 1 && idx.unique === true
          );
          if (indexToDrop && indexToDrop.name) {
            await collection.dropIndex(indexToDrop.name);
            console.log(`Successfully dropped index: ${indexToDrop.name}`);
          }
        } else {
          throw error;
        }
      }
    }

    // Check if compound unique index already exists
    const compoundIndex = indexes.find(
      (idx: any) =>
        idx.key &&
        idx.key.name === 1 &&
        idx.key.subCategory === 1 &&
        idx.unique === true
    );

    if (!compoundIndex) {
      console.log('Creating compound unique index on "name" and "subCategory"...');
      await collection.createIndex(
        { name: 1, subCategory: 1 },
        { unique: true, name: "name_1_subCategory_1" }
      );
      console.log("Successfully created compound unique index");
    } else {
      console.log("Compound unique index already exists");
    }

    // Verify the new index
    const finalIndexes = await collection.indexes();
    console.log("Final indexes:", finalIndexes);

    return {
      success: true,
      message: "Tag index migration completed successfully!",
    };
  } catch (error: any) {
    console.error("Error fixing tag index:", error);
    return {
      success: false,
      message: `Error fixing tag index: ${error.message}`,
    };
  }
};
