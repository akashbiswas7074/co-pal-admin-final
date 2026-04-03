import mongoose, { Schema, Document } from "mongoose";

export interface IInfluencerSpotlight extends Document {
    name: string;
    handle: string;
    platform: "TikTok" | "Instagram";
    mediaUrl: string;
    thumbnailUrl?: string;
    productReference?: string; // Link to a product
    productName?: string;
    isActive: boolean;
    order: number;
}

const InfluencerSpotlightSchema = new Schema<IInfluencerSpotlight>(
    {
        name: { type: String, required: true, trim: true },
        handle: { type: String, required: true, trim: true },
        platform: { type: String, enum: ["TikTok", "Instagram"], default: "TikTok" },
        mediaUrl: { type: String, required: true },
        thumbnailUrl: { type: String },
        productReference: { type: String },
        productName: { type: String },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const InfluencerSpotlight = mongoose.models.InfluencerSpotlight || mongoose.model<IInfluencerSpotlight>("InfluencerSpotlight", InfluencerSpotlightSchema);

export default InfluencerSpotlight;
