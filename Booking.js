import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  guests: { type: Number, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Booking', bookingSchema);
