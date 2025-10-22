import mongoose from 'mongoose';

const BrandSettingSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'VirtualDesk', trim: true },
    logoUrl: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.models.BrandSetting || mongoose.model('BrandSetting', BrandSettingSchema);
