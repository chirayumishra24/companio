import { createFirestoreModel } from "../lib/firestoreModel.js";

const User = createFirestoreModel("users", {
  defaults: {
    email: "",
    passwordHash: "",
    likes: [],
    dislikes: [],
    matches: [],
  },
  timestamps: true,
});

export default User;
