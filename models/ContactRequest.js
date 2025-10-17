import mongoose from 'mongoose';

const ContactRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
}, { timestamps: true });

export default mongoose.models.ContactRequest || mongoose.model('ContactRequest', ContactRequestSchema);
