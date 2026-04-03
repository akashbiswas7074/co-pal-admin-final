/**
 * Script to fix the tag collection index
 * Run this once to migrate from unique index on 'name' to compound unique index on 'name' and 'subCategory'
 * 
 * Usage: node scripts/fix-tag-index.js
 * Or run in MongoDB shell: mongo your-database-name scripts/fix-tag-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixTagIndex() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('tags');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Check if old unique index on 'name' exists
    const nameIndex = indexes.find(idx => 
      idx.key && idx.key.name === 1 && 
      idx.unique === true && 
      !idx.key.subCategory
    );

    if (nameIndex) {
      console.log('Found old unique index on "name", dropping it...');
      try {
        await collection.dropIndex('name_1');
        console.log('Successfully dropped old index on "name"');
      } catch (error) {
        console.log('Error dropping index (might not exist):', error.message);
      }
    }

    // Check if compound unique index already exists
    const compoundIndex = indexes.find(idx => 
      idx.key && 
      idx.key.name === 1 && 
      idx.key.subCategory === 1 && 
      idx.unique === true
    );

    if (!compoundIndex) {
      console.log('Creating compound unique index on "name" and "subCategory"...');
      await collection.createIndex(
        { name: 1, subCategory: 1 },
        { unique: true, name: 'name_1_subCategory_1' }
      );
      console.log('Successfully created compound unique index');
    } else {
      console.log('Compound unique index already exists');
    }

    // Verify the new index
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes);

    console.log('Index migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing tag index:', error);
    process.exit(1);
  }
}

fixTagIndex();
