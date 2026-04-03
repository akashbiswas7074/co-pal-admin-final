
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://abworkhouse01_db_user:Akashbiswas7797@ac-xmjscc4-shard-00-00.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-01.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-02.hw8gwjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-11sxr2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function fixFooter() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: "vibecart" });
        console.log("Connected to vibecart database");

        const collection = mongoose.connection.collection('websitefooters');

        // Update the active footer (there should only be one)
        const result = await collection.updateMany(
            { isActive: true },
            { $set: { showFooterName: false } }
        );

        console.log(`Updated ${result.modifiedCount} footers to showFooterName: false`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixFooter();
