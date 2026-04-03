import mongoose, { Schema, Document } from "mongoose";

export interface IFeaturedReview extends Document {
    quote: string;
    reviewerName: string;
    reviewerSubtext?: string;
    stars: number;
    date?: Date;
    isVerified: boolean;
    totalReviewsText: string; // e.g. "40K"
    averageRatingText: string; // e.g. "4.9"
    isActive: boolean;
    order: number;
    backgroundImage?: string;
    quoteColor?: string;
    reviewerNameColor?: string;
    reviewerSubtextColor?: string;
    socialProofColor?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeaturedReviewSchema = new Schema<IFeaturedReview>(
    {
        quote: { type: String, required: true },
        reviewerName: { type: String, required: true },
        reviewerSubtext: { type: String },
        stars: { type: Number, default: 5 },
        date: { type: Date },
        isVerified: { type: Boolean, default: true },
        totalReviewsText: { type: String, default: "40K" },
        averageRatingText: { type: String, default: "4.9" },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        backgroundImage: { type: String },
        quoteColor: { type: String, default: "#ffffff" },
        reviewerNameColor: { type: String, default: "#ffffff" },
        reviewerSubtextColor: { type: String, default: "rgba(255, 255, 255, 0.7)" },
        socialProofColor: { type: String, default: "#ffffff" },
    },
    { timestamps: true }
);

delete mongoose.models.FeaturedReview;
const FeaturedReview = mongoose.models.FeaturedReview || mongoose.model<IFeaturedReview>("FeaturedReview", FeaturedReviewSchema);

export default FeaturedReview;
