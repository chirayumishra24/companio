import { createFirestoreModel } from "../lib/firestoreModel.js";

const Message = createFirestoreModel("messages", {
  defaults: {
    sender: "",
    receiver: "",
    content: "",
  },
  timestamps: true,
});

export default Message;
