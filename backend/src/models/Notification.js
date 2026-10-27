// backend/src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_cancelled",
        "check_in",
        "check_out",
        "payment_received",
        "payment_failed",
        "housekeeping_task",
        "maintenance_ticket",
        "review_received",
        "system_alert",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    channel: {
      type: String,
      enum: ["in_app", "email", "sms", "push"],
      default: "in_app",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    actionUrl: String,
    expiresAt: Date,
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
