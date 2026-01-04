// Script to fix isMandatory field based on type field
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://admin:admin123@91.108.110.49:27017/vibecart?authSource=admin&directConnection=true';

async function fixMandatoryField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Tag = mongoose.model('Tag', new mongoose.Schema({}, { strict: false }));

    // Find all tags with MANDATORY_UNIVERSAL type but isMandatory is not true
    const tagsToFix = await Tag.find({
      type: 'MANDATORY_UNIVERSAL',
      $or: [
        { isMandatory: { $exists: false } },
        { isMandatory: false },
        { isMandatory: null },
        { isMandatory: undefined }
      ]
    });

    console.log(`Found ${tagsToFix.length} tags to fix:\n`);
    tagsToFix.forEach(tag => {
      console.log(`- ${tag.name}: type=${tag.type}, isMandatory=${tag.isMandatory}`);
    });

    if (tagsToFix.length > 0) {
      const result = await Tag.updateMany(
        {
          type: 'MANDATORY_UNIVERSAL',
          $or: [
            { isMandatory: { $exists: false } },
            { isMandatory: false },
            { isMandatory: null },
            { isMandatory: undefined }
          ]
        },
        {
          $set: { isMandatory: true }
        }
      );

      console.log(`\n✅ Updated ${result.modifiedCount} tags to set isMandatory=true`);
    } else {
      console.log('\n✅ All tags already have correct isMandatory values');
    }

    // Also fix tags with UNIVERSAL_OPTIONAL type but isMandatory is true
    const optionalTagsToFix = await Tag.find({
      type: 'UNIVERSAL_OPTIONAL',
      isMandatory: true
    });

    if (optionalTagsToFix.length > 0) {
      console.log(`\nFound ${optionalTagsToFix.length} optional tags with isMandatory=true, fixing...`);
      const result = await Tag.updateMany(
        { type: 'UNIVERSAL_OPTIONAL', isMandatory: true },
        { $set: { isMandatory: false } }
      );
      console.log(`✅ Updated ${result.modifiedCount} tags to set isMandatory=false`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMandatoryField();
