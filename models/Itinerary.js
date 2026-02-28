import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  destination: { type: String, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
  budget: String,
  travelType: String,
  interests: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  createdAt: { type: Date, default: Date.now }
});

const Itinerary = mongoose.models.Itinerary || mongoose.model('Itinerary', itinerarySchema);
export default Itinerary;
