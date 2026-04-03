const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error('MONGODB_URL not found in .env file');
    process.exit(1);
}

// Construct URL with database name
const urlParts = MONGODB_URL.split('/?');
const connectionString = urlParts[0].endsWith('/') ? `${urlParts[0]}vibecart?${urlParts[1]}` : `${urlParts[0]}/vibecart?${urlParts[1]}`;

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(connectionString);
        console.log('Connected to vibecart database.');

        const collection = mongoose.connection.db.collection('collectionhighlights');
        const documents = await collection.find({}).toArray();
        console.log(`Found ${documents.length} documents.`);

        for (const doc of documents) {
            console.log(`Processing document ${doc._id}...`);

            const updatedItems = doc.items.map(item => ({
                ...item,
                titleColor: item.titleColor || "#000000",
                descriptionColor: item.descriptionColor || "#666666",
                buttonColor: item.buttonColor || "#ffffff",
                buttonTextColor: item.buttonTextColor || "#000000"
            }));

            const result = await collection.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        items: updatedItems,
                        titleColor: doc.titleColor || "#000000",
                        subtitleColor: doc.subtitleColor || "#666666"
                    }
                }
            );

            console.log(`Update result for ${doc._id}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

migrate();
