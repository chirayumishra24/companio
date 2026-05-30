import { createFirestoreModel } from "../lib/firestoreModel.js";

const Comment = createFirestoreModel("comments", {
  defaults: {
    postId: "",
    authorEmail: "",
    authorId: "",
    content: "",
    parentCommentId: "", // for nested replies
    likes: [], // array of emails
    likesCount: 0,
  },
  timestamps: true,
});

export default Comment;
