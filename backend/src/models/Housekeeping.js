import mongoose from "mongoose";

const housekeepingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    taskType: {
      type: String,
      enum: [
        "daily_cleaning",
        "deep_cleaning",
        "checkout_cleaning",
        "turndown",
        "maintenance",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "verified", "cancelled"],
      default: "pending",
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    checklist: [{ task: String, completed: Boolean, notes: String }],
    notes: String,
    photos: [String],
    timeSpent: Number, // minutes
  },
  { timestamps: true },
);

housekeepingSchema.index({ hotelId: 1, status: 1 });
housekeepingSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model("Housekeeping", housekeepingSchema);
