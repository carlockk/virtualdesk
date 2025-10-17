import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    personType: { type: String, enum: ['natural', 'empresa'], default: 'natural' },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    rut: { type: String, default: '', trim: true },
    businessName: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '', trim: true },
    avatarPublicId: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
