import { createFirestoreModel } from "../lib/firestoreModel.js";

const Post = createFirestoreModel("posts", {
  defaults: {
    authorEmail: "",
    authorId: "",
    type: "post", // "post" | "story" | "trip-log"
    caption: "",
    images: [],
    location: "",
    locationCoords: null, // { lat, lng }
    tags: [],
    likes: [], // array of emails
    likesCount: 0,
    commentsCount: 0,
    visibility: "public", // "public" | "followers" | "private"
  },
  timestamps: true,
});

export default Post;
