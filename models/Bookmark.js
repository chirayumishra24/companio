import { createFirestoreModel } from "../lib/firestoreModel.js";

const Bookmark = createFirestoreModel("bookmarks", {
  defaults: {
    userEmail: "",
    postId: "",
  },
  timestamps: true,
});

export default Bookmark;
