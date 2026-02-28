import { createFirestoreModel } from "../lib/firestoreModel.js";

const Review = createFirestoreModel("reviews", {
  defaults: {
    reviewer: "",
    target: "",
    rating: 0,
    comment: "",
  },
  timestamps: true,
});

export default Review;

