import mongoose from 'mongoose';

const SubmenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    href: { type: String, required: true, trim: true, maxlength: 2048 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    href: { type: String, required: true, trim: true, maxlength: 2048 },
    icon: { type: String, default: '', trim: true, maxlength: 60 },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    submenus: { type: [SubmenuSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
