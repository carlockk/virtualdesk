import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    path: { type: String, default: '', trim: true, maxlength: 200 },
    summary: { type: String, default: '', trim: true, maxlength: 500 },
    content: { type: String, default: '' },
    heroImage: { type: String, default: '', trim: true, maxlength: 2048 },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    order: { type: Number, default: 0 },
    system: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PageSchema.index({ slug: 1 }, { unique: true });
PageSchema.index({ path: 1 }, { unique: true, sparse: true });

export default mongoose.models.Page || mongoose.model('Page', PageSchema);
