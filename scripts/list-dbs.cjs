const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL;

async function listDbs() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log('Connected to MongoDB.');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(db => db.name));

    } catch (error) {
        console.error('List DBs failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listDbs();
