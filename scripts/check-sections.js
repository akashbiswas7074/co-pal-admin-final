const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Path to .env in co-pal-admin-final
const envPath = path.join(__dirname, '../.env');

const loadEnv = () => {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split(/\r?\n/);
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const parts = trimmedLine.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            }
        });
    }
};

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

// Minimal Schema
const WebsiteSectionSchema = new mongoose.Schema({
    name: String,
    sectionId: String,
    isVisible: Boolean,
    order: Number,
});

const WebsiteSection = mongoose.models.WebsiteSection || mongoose.model('WebsiteSection', WebsiteSectionSchema);

async function checkSections() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const sections = await WebsiteSection.find({
            sectionId: { $in: ['featured-review-hero', 'recent-blogs', 'influencer-spotlight'] }
        }).lean();

        console.log("Status of new homepage sections:");
        console.log(JSON.stringify(sections, null, 2));

        mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkSections();
