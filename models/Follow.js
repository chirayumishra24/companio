import { createFirestoreModel } from "../lib/firestoreModel.js";

const Follow = createFirestoreModel("follows", {
  defaults: {
    followerEmail: "",
    followingEmail: "",
    status: "active", // "active" | "blocked"
  },
  timestamps: true,
});

export default Follow;
