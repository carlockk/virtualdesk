import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    channel: { type: String, required: true, index: true },
    sender: { type: String, default: 'Invitado' },
    fromRole: { type: String, enum: ['user', 'admin', 'guest'], default: 'guest' },
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MessageSchema.index({ channel: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
