import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    summary: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    imagePublicId: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    price: { type: Number, default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ServiceSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
