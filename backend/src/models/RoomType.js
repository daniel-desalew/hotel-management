import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true }, // Deluxe, Suite, etc.
    code: { type: String, required: true },
    description: String,
    maxOccupancy: { type: Number, required: true },
    maxAdults: { type: Number, required: true },
    maxChildren: { type: Number, default: 0 },
    bedConfiguration: [
      {
        bedType: {
          type: String,
          enum: ["single", "double", "queen", "king", "sofa_bed"],
        },
        count: Number,
      },
    ],
    basePrice: { type: Number, required: true },
    weekendPrice: Number,
    extraPersonCharge: { type: Number, default: 0 },
    childCharge: { type: Number, default: 0 },
    size: Number, // sq ft
    amenities: [String],
    images: [String],
    totalRooms: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomTypeSchema.index({ hotelId: 1, code: 1 }, { unique: true });

export default mongoose.model("RoomType", roomTypeSchema);
