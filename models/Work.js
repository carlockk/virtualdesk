import mongoose from 'mongoose';

const WorkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    projectUrl: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.models.Work || mongoose.model('Work', WorkSchema);
