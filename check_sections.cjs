
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://abworkhouse01_db_user:Akashbiswas7797@ac-xmjscc4-shard-00-00.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-01.hw8gwjn.mongodb.net:27017,ac-xmjscc4-shard-00-02.hw8gwjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-11sxr2-shard-0&authSource=admin&retryWrites=true&w=majority";

async function listSections() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: "vibecart" });
        console.log("Connected to vibecart database");

        const collection = mongoose.connection.collection('websitesections');
        const sections = await collection.find({}).sort({ order: 1 }).toArray();

        console.log(`Found ${sections.length} sections`);
        sections.forEach((s, i) => {
            console.log(`${i + 1}. [${s.isVisible ? 'VISIBLE' : 'HIDDEN '}] Name: ${s.name} | ID: ${s.sectionId} | Order: ${s.order}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listSections();
