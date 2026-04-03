const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL;

async function debug() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log('Connected to MongoDB.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const CollectionHighlight = mongoose.connection.collection('collectionhighlights');
        const count = await CollectionHighlight.countDocuments();
        console.log(`Documents in 'collectionhighlights': ${count}`);

        const sample = await CollectionHighlight.findOne();
        console.log('Sample document:', JSON.stringify(sample, null, 2));

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
