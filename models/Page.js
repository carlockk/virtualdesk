import mongoose from 'mongoose';

const PageSectionItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    imageUrl: { type: String, default: '', trim: true, maxlength: 2048 },
    linkLabel: { type: String, default: '', trim: true, maxlength: 80 },
    linkUrl: { type: String, default: '', trim: true, maxlength: 2048 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const PageSectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    type: { type: String, enum: ['cards', 'slider'], default: 'cards' },
    position: { type: String, enum: ['belowTitle', 'main', 'afterContent'], default: 'main' },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    order: { type: Number, default: 0 },
    items: { type: [PageSectionItemSchema], default: [] },
  },
  { _id: false },
);

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
    sections: { type: [PageSectionSchema], default: [] },
  },
  { timestamps: true },
);

PageSchema.index({ slug: 1 }, { unique: true });
PageSchema.index({ path: 1 }, { unique: true, sparse: true });

export default mongoose.models.Page || mongoose.model('Page', PageSchema);
