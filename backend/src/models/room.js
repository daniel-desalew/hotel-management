import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "reserved",
        "cleaning",
        "maintenance",
        "out_of_order",
      ],
      default: "available",
    },
    housekeepingStatus: {
      type: String,
      enum: ["clean", "dirty", "inspected", "in_progress"],
      default: "clean",
    },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    features: [String], // e.g. ['balcony', 'sea_view', 'connecting_door']
    notes: String,
    lastCleanedAt: Date,
    lastInspectedAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hotelId: 1, status: 1 });
roomSchema.index({ roomTypeId: 1 });

export default mongoose.model("Room", roomSchema);
