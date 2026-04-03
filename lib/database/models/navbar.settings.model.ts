import mongoose, { Schema, Document } from 'mongoose';

export interface INavbarSettings extends Document {
  _id: string;
  backgroundType: 'solid' | 'gradient' | 'blur';
  backgroundColorValue: string;
  backgroundGradientValue: string;
  blurOpacity: number;
  desktopLayout: 'inline' | 'menu';
  textColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NavbarSettingsSchema = new Schema<INavbarSettings>({
  backgroundType: {
    type: String,
    enum: ['solid', 'gradient', 'blur'],
    default: 'blur'
  },
  backgroundColorValue: {
    type: String,
    default: '#1a0a2c'
  },
  backgroundGradientValue: {
    type: String,
    default: 'linear-gradient(to right, #1a0a2c, #4a192c)'
  },
  blurOpacity: {
    type: Number,
    default: 40,
    min: 0,
    max: 100
  },
  desktopLayout: {
    type: String,
    enum: ['inline', 'menu'],
    default: 'inline'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one active setting at a time
NavbarSettingsSchema.pre('save', async function() {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
});

const NavbarSettings = mongoose.models.NavbarSettings || mongoose.model<INavbarSettings>('NavbarSettings', NavbarSettingsSchema);

export default NavbarSettings;
