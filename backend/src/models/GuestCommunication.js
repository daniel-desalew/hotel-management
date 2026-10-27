import mongoose from "mongoose";

const guestCommunicationSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp", "phone", "in_app"],
      default: "email",
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "sent", "scheduled", "failed"],
      default: "sent",
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("GuestCommunication", guestCommunicationSchema);
