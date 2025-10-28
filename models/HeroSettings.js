import mongoose from 'mongoose';

const HeroButtonSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    href: { type: String, required: true, trim: true, maxlength: 2048 },
    icon: { type: String, default: '', trim: true, maxlength: 60 },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const HeroSlideSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    imageUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const HeroTextSchema = new mongoose.Schema(
  {
    text: { type: String, default: '', trim: true, maxlength: 200 },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

const HeroSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    visible: { type: Boolean, default: true },
    height: { type: Number, default: 80 },
    title: { type: HeroTextSchema, default: () => ({ text: '', visible: true }) },
    subtitle: { type: HeroTextSchema, default: () => ({ text: '', visible: true }) },
    heroImage: { type: String, default: '', trim: true, maxlength: 2048 },
    slides: { type: [HeroSlideSchema], default: [] },
    buttons: { type: [HeroButtonSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.HeroSettings || mongoose.model('HeroSettings', HeroSettingsSchema);
