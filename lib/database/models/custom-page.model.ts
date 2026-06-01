import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomPage extends Document {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomPageSchema = new Schema<ICustomPage>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CustomPage = mongoose.models.CustomPage || mongoose.model<ICustomPage>('CustomPage', CustomPageSchema);

export default CustomPage;
