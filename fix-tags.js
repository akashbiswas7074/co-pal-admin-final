// Script to fix tags that don't have subCategory field
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://admin:admin123@91.108.110.49:27017/vibecart?authSource=admin&directConnection=true';

async function fixTags() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Tag and SubCategory models
    const Tag = mongoose.model('Tag', new mongoose.Schema({}, { strict: false }));
    const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));

    // Find all tags without subCategory
    const tagsWithoutSubCategory = await Tag.find({
      $or: [
        { subCategory: { $exists: false } },
        { subCategory: null },
        { subCategory: undefined }
      ]
    });

    console.log(`\n📋 Found ${tagsWithoutSubCategory.length} tags without subCategory:\n`);
    
    if (tagsWithoutSubCategory.length === 0) {
      console.log('✅ All tags have subCategory assigned!');
      await mongoose.disconnect();
      return;
    }

    // Display tags
    tagsWithoutSubCategory.forEach((tag, index) => {
      console.log(`${index + 1}. Tag: "${tag.name}"`);
      console.log(`   ID: ${tag._id}`);
      console.log(`   Type: ${tag.type || 'N/A'}`);
      console.log(`   Is Mandatory: ${tag.isMandatory || false}`);
      console.log('');
    });

    // Get all sub-categories
    const subCategories = await SubCategory.find({}).limit(20);
    console.log(`\n📁 Available Sub-Categories (${subCategories.length}):\n`);
    
    if (subCategories.length === 0) {
      console.log('❌ No sub-categories found. Cannot assign tags.');
      console.log('\n💡 Option: Delete invalid tags?');
      const deleteTags = process.argv[2] === '--delete';
      if (deleteTags) {
        await Tag.deleteMany({
          $or: [
            { subCategory: { $exists: false } },
            { subCategory: null },
            { subCategory: undefined }
          ]
        });
        console.log('✅ Deleted all tags without subCategory');
      }
      await mongoose.disconnect();
      return;
    }

    subCategories.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.name}`);
      console.log(`   ID: ${sub._id}`);
      console.log(`   Parent: ${sub.parent}`);
      console.log('');
    });

    // Get sub-category ID from command line or use first one
    const subCategoryIdArg = process.argv[2];
    let targetSubCategoryId = null;

    if (subCategoryIdArg) {
      // Try to find by ID
      const found = subCategories.find(
        (sc) => sc._id.toString() === subCategoryIdArg || sc._id.equals(subCategoryIdArg)
      );
      if (found) {
        targetSubCategoryId = found._id;
      } else {
        console.log(`\n⚠️  Sub-category ID "${subCategoryIdArg}" not found.`);
        console.log('Using first sub-category instead.\n');
        targetSubCategoryId = subCategories[0]._id;
      }
    } else {
      // Use first sub-category
      targetSubCategoryId = subCategories[0]._id;
      console.log(`\n💡 No sub-category specified. Using first one: "${subCategories[0].name}"`);
      console.log(`   Usage: node fix-tags.js <subCategoryId> or node fix-tags.js --delete\n`);
    }

    // Check if --delete flag is set
    if (process.argv.includes('--delete')) {
      console.log('\n🗑️  Deleting tags without subCategory...');
      const result = await Tag.deleteMany({
        $or: [
          { subCategory: { $exists: false } },
          { subCategory: null },
          { subCategory: undefined }
        ]
      });
      console.log(`✅ Deleted ${result.deletedCount} tags`);
    } else {
      // Assign tags to sub-category
      console.log(`\n🔧 Assigning ${tagsWithoutSubCategory.length} tags to sub-category: ${targetSubCategoryId}`);
      console.log(`   Sub-category: ${subCategories.find(sc => sc._id.equals(targetSubCategoryId))?.name}\n`);

      const updateResult = await Tag.updateMany(
        {
          $or: [
            { subCategory: { $exists: false } },
            { subCategory: null },
            { subCategory: undefined }
          ]
        },
        {
          $set: {
            subCategory: targetSubCategoryId
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} tags`);
      
      // Verify the update
      const verifyTags = await Tag.find({ subCategory: targetSubCategoryId });
      console.log(`\n✅ Verification: Found ${verifyTags.length} tags for this sub-category`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTags();
