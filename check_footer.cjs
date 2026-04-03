
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://abworkhouse01_db_user:Akashbiswas7797@ac-xmjscc4-shard-00-00.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-01.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-02.hw8gwjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-11sxr2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function listAllFooters() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: "vibecart" });
        console.log("Connected to vibecart database");

        const collection = mongoose.connection.collection('websitefooters');
        const footers = await collection.find({}).toArray();

        console.log(`Found ${footers.length} footers`);
        footers.forEach((f, i) => {
            console.log(`--- Footer ${i + 1} ---`);
            console.log(JSON.stringify(f, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllFooters();
