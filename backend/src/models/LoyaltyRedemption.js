import mongoose from "mongoose";

const loyaltyRedemptionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoyaltyProgram",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, trim: true },
    rewardType: {
      type: String,
      enum: [
        "food_voucher",
        "spa",
        "room_upgrade",
        "discount",
        "cashback",
        "other",
      ],
      default: "discount",
    },
    redeemedPoints: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rejected"],
      default: "approved",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("LoyaltyRedemption", loyaltyRedemptionSchema);
