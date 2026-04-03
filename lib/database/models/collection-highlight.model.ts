import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionHighlightItem {
    title: string;
    description?: string;
    imageUrl: string;
    buttonText: string;
    buttonLink: string;
    gridSpan?: number; // 1 or 2 (for wider cards)
    bgGradient?: string;
    titleColor?: string;
    descriptionColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
}

export interface ICollectionHighlight extends Document {
    title: string;
    subtitle?: string;
    items: ICollectionHighlightItem[];
    isActive: boolean;
    order: number;
    titleColor?: string;
    subtitleColor?: string;
    backgroundColor?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CollectionHighlightItemSchema = new Schema<ICollectionHighlightItem>({
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    buttonText: { type: String, default: "Shop Now" },
    buttonLink: { type: String, required: true },
    gridSpan: { type: Number, default: 1 },
    bgGradient: { type: String },
    titleColor: { type: String },
    descriptionColor: { type: String },
    buttonColor: { type: String },
    buttonTextColor: { type: String },
});

const CollectionHighlightSchema = new Schema<ICollectionHighlight>(
    {
        title: { type: String, required: true },
        subtitle: { type: String },
        items: [CollectionHighlightItemSchema],
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        titleColor: { type: String },
        subtitleColor: { type: String },
        backgroundColor: { type: String, default: "#ffffff" },
    },
    { timestamps: true }
);

delete mongoose.models.CollectionHighlight;
const CollectionHighlight = mongoose.models.CollectionHighlight || mongoose.model<ICollectionHighlight>('CollectionHighlight', CollectionHighlightSchema);

export default CollectionHighlight;
