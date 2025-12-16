import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
  id: string;
  sender: "user" | "ai" ;
  text: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  company_id: mongoose.Types.ObjectId;
  title: string; // Auto-generated from first message
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatHistorySchema = new Schema<IChatHistory>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Index for efficient querying
chatHistorySchema.index({ company_id: 1, createdAt: -1 });

const ChatHistory: Model<IChatHistory> =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>("ChatHistory", chatHistorySchema);

export default ChatHistory;
