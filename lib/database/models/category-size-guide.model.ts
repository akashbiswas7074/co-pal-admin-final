import mongoose, { Schema, Document } from 'mongoose';

export interface ICategorySizeGuide extends Document {
    _id: string;
    category: string;
    subCategory: string;
    title: string;
    htmlContent: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySizeGuideSchema = new Schema<ICategorySizeGuide>(
    {
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        subCategory: {
            type: String,
            required: [true, 'Subcategory is required'],
            trim: true,
        },
        title: {
            type: String,
            default: 'Size Guide',
            trim: true,
        },
        htmlContent: {
            type: String,
            required: [true, 'Content is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Create unique compound index for category + subCategory
CategorySizeGuideSchema.index({ category: 1, subCategory: 1 }, { unique: true });

// Cache invalidation for development
if (process.env.NODE_ENV !== 'production' && mongoose.models.CategorySizeGuide) {
    delete mongoose.models.CategorySizeGuide;
}

const CategorySizeGuide = mongoose.models.CategorySizeGuide || mongoose.model<ICategorySizeGuide>('CategorySizeGuide', CategorySizeGuideSchema);

export default CategorySizeGuide;
