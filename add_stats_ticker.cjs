
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://abworkhouse01_db_user:Akashbiswas7797@ac-xmjscc4-shard-00-00.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-01.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-02.hw8gwjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-11sxr2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function addStatsTicker() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: "vibecart" });
        console.log("Connected to vibecart database");

        const collection = mongoose.connection.collection('websitesections');

        // Check if it already exists
        const existing = await collection.findOne({ sectionId: 'stats-ticker' });
        if (existing) {
            console.log("Section 'stats-ticker' already exists.");
        } else {
            // Find the order of banner-carousel to place it right after
            const banner = await collection.findOne({ sectionId: 'banner-carousel' });
            const newOrder = banner ? banner.order + 1 : 11;

            const result = await collection.insertOne({
                name: "Stats Ticker",
                sectionId: "stats-ticker",
                isVisible: true,
                order: newOrder,
                description: "Moving band with feature highlights (Handcrafted, Shipping, etc.)",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("Section 'stats-ticker' created with ID:", result.insertedId);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addStatsTicker();
