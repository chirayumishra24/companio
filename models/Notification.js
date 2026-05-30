import { createFirestoreModel } from "../lib/firestoreModel.js";

const Notification = createFirestoreModel("notifications", {
  defaults: {
    recipientEmail: "",
    type: "", // "like" | "comment" | "follow" | "mention"
    fromEmail: "",
    fromName: "",
    postId: "", // optional
    message: "",
    read: false,
  },
  timestamps: true,
});

export default Notification;
