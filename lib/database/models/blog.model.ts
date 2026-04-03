import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
    title: string;
    slug: string;
    author: string;
    date: Date;
    excerpt: string;
    content: string; // Rich HTML content
    mainImage: string;
    isActive: boolean;
    featured?: boolean;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        author: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
        excerpt: { type: String, required: true },
        content: { type: String, required: true },
        mainImage: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        featured: { type: Boolean, default: false },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

const Blog = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
