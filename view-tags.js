// Quick script to view tags in MongoDB
import mongoose from 'mongoose';

// Connection string - using the connection string from .env
const MONGODB_URI = 'mongodb://admin:admin123@91.108.110.49:27017/vibecart?authSource=admin&directConnection=true';

async function viewTags() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the database
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`Database: ${dbName}\n`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '), '\n');

    // View tags collection
    const Tag = mongoose.model('Tag', new mongoose.Schema({}, { strict: false }));
    const tags = await Tag.find({});
    
    console.log(`\n📋 Total Tags: ${tags.length}\n`);
    
    if (tags.length > 0) {
      console.log('Tags in database:');
      console.log('='.repeat(80));
      tags.forEach((tag, index) => {
        console.log(`\nTag ${index + 1}:`);
        console.log(`  Name: ${tag.name}`);
        console.log(`  Type: ${tag.type || 'N/A'}`);
        console.log(`  Is Mandatory: ${tag.isMandatory}`);
        console.log(`  SubCategory ID: ${tag.subCategory}`);
        console.log(`  SubCategory Type: ${typeof tag.subCategory}`);
        console.log(`  SubCategory toString: ${tag.subCategory?.toString()}`);
        console.log(`  Is Active: ${tag.isActive}`);
        console.log(`  Created: ${tag.createdAt}`);
      });
    } else {
      console.log('No tags found in database.');
    }

    // View sub-categories
    const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
    const subCategories = await SubCategory.find({}).limit(5);
    
    console.log(`\n\n📁 Sub-Categories (showing first 5):`);
    console.log('='.repeat(80));
    subCategories.forEach((sub, index) => {
      console.log(`\nSub-Category ${index + 1}:`);
      console.log(`  ID: ${sub._id}`);
      console.log(`  Name: ${sub.name}`);
      console.log(`  Parent: ${sub.parent}`);
    });

    // Check for specific sub-category
    const subCategoryId = process.argv[2]; // Get from command line argument
    if (subCategoryId) {
      console.log(`\n\n🔍 Checking tags for sub-category: ${subCategoryId}`);
      console.log('='.repeat(80));
      
      // Try ObjectId
      let foundTags = await Tag.find({ subCategory: new mongoose.Types.ObjectId(subCategoryId) });
      console.log(`\nFound ${foundTags.length} tags with ObjectId query`);
      
      // Try string
      if (foundTags.length === 0) {
        foundTags = await Tag.find({ subCategory: subCategoryId });
        console.log(`Found ${foundTags.length} tags with string query`);
      }
      
      if (foundTags.length > 0) {
        foundTags.forEach((tag, index) => {
          console.log(`\n  Tag ${index + 1}: ${tag.name} (Mandatory: ${tag.isMandatory})`);
        });
      } else {
        console.log('  No tags found for this sub-category');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewTags();
