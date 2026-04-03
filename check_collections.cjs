
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://abworkhouse01_db_user:Akashbiswas7797@ac-xmjscc4-shard-00-00.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-01.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-02.hw8gwjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-11sxr2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function checkCollections() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCollections();
