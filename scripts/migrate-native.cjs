const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error('MONGODB_URL not found in .env file');
    process.exit(1);
}

// Ensure we target vibecart database
const urlParts = MONGODB_URL.split('/?');
let connectionString = urlParts[0].endsWith('/') ? `${urlParts[0]}vibecart?${urlParts[1]}` : `${urlParts[0]}/vibecart?${urlParts[1]}`;

// Check if database is already in the string (e.g. if it didn't end with /)
if (!connectionString.includes('/vibecart?')) {
    // If there was no trailing slash and no db name, this might be tricky.
    // Let's just use the client.db('vibecart') method instead of relying on the URL.
}

async function run() {
    const client = new MongoClient(MONGODB_URL);

    try {
        await client.connect();
        console.log('Connected to MongoDB cluster.');

        const db = client.db('vibecart');
        const collection = db.collection('collectionhighlights');

        const documents = await collection.find({}).toArray();
        console.log(`Found ${documents.length} documents.`);

        for (const doc of documents) {
            console.log(`Updating document ${doc._id}...`);

            const updatedItems = doc.items.map(item => ({
                ...item,
                titleColor: item.titleColor || "#000000",
                descriptionColor: item.descriptionColor || "#666666",
                buttonColor: item.buttonColor || "#ffffff",
                buttonTextColor: item.buttonTextColor || "#000000"
            }));

            const result = await collection.updateOne(
                { _id: doc._id },
                { $set: { items: updatedItems } }
            );

            console.log(`Update result for ${doc._id}:`, result.modifiedCount > 0 ? 'Modified' : 'Already up to date or failed');
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

run();
