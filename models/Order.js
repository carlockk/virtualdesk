import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: String,
  clientEmail: String,
  items: [{
    serviceId: String,
    serviceName: String,
    quantity: Number,
    unitPrice: Number,
  }],
  status: { type: String, default: 'PENDIENTE' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
