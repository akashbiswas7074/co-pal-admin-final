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
    sectionId: { type: String, unique: true },
    isVisible: Boolean,
    order: Number,
    description: String,
});

const WebsiteSection = mongoose.models.WebsiteSection || mongoose.model('WebsiteSection', WebsiteSectionSchema);

async function injectSections() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const sectionsToInject = [
            {
                name: "Featured Review Hero",
                sectionId: "featured-review-hero",
                isVisible: true,
                order: 115,
                description: "Large quote and review section with star ratings"
            },
            {
                name: "Recent Blogs",
                sectionId: "recent-blogs",
                isVisible: true,
                order: 125,
                description: "Grid display of recent blog posts"
            },
            {
                name: "Influencer Spotlight",
                sectionId: "influencer-spotlight",
                isVisible: true,
                order: 135,
                description: "Section showcasing influencer content and social proof"
            }
        ];

        for (const section of sectionsToInject) {
            const exists = await WebsiteSection.findOne({ sectionId: section.sectionId });
            if (!exists) {
                await WebsiteSection.create(section);
                console.log(`Injected section: ${section.name}`);
            } else {
                console.log(`Section already exists: ${section.name}`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

injectSections();
