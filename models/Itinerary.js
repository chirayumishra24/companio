import { createFirestoreModel } from "../lib/firestoreModel.js";

const Itinerary = createFirestoreModel("itineraries", {
  defaults: {
    user: "",
    destination: "",
    description: "",
    startDate: null,
    endDate: null,
    budget: "",
    travelType: "",
    interests: [],
    likes: [],
  },
  timestamps: true,
});

export default Itinerary;
