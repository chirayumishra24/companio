import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true, trim: true },
  receiver: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
