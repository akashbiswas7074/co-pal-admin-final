
import mongoose, { Schema, Document } from 'mongoose';

export interface IStatsTickerItem {
    emoji: string;
    label: string;
}

export interface IStatsTicker extends Document {
    items: IStatsTickerItem[];
    backgroundColor: string;
    color1: string;
    color2: string;
    speed: number; // duration in seconds
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StatsTickerItemSchema = new Schema<IStatsTickerItem>({
    emoji: { type: String, required: true },
    label: { type: String, required: true },
});

const StatsTickerSchema = new Schema<IStatsTicker>(
    {
        items: { type: [StatsTickerItemSchema], default: [] },
        backgroundColor: {
            type: String,
            default: 'linear-gradient(90deg, #22c9a0 0%, #7c3aed 50%, #e879f9 100%)'
        },
        color1: { type: String, default: '#22c9a0' },
        color2: { type: String, default: '#e879f9' },
        speed: { type: Number, default: 28 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const StatsTicker = mongoose.models.StatsTicker || mongoose.model<IStatsTicker>('StatsTicker', StatsTickerSchema);

export default StatsTicker;
