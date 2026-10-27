import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      default: null,
    },
    guestName: { type: String, default: "Guest" },
    roomNumber: { type: String, default: "" },
    requestType: {
      type: String,
      enum: [
        "room_service",
        "laundry",
        "transport",
        "concierge",
        "amenity",
        "housekeeping",
        "maintenance",
        "other",
      ],
      default: "other",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "completed", "cancelled"],
      default: "open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: String,
  },
  { timestamps: true },
);

serviceRequestSchema.index({ hotelId: 1, status: 1 });
serviceRequestSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model("ServiceRequest", serviceRequestSchema);
