import mongoose from "mongoose";

const loyaltyProgramSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    totalPoints: { type: Number, default: 0, min: 0 },
    pointsBalance: { type: Number, default: 0, min: 0 },
    tier: {
      type: String,
      enum: ["silver", "gold", "platinum", "diamond"],
      default: "silver",
    },
    status: {
      type: String,
      enum: ["active", "paused", "inactive"],
      default: "active",
    },
    lastVisit: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

const getTierFromPoints = (points) => {
  if (points >= 5000) return "diamond";
  if (points >= 2500) return "platinum";
  if (points >= 1000) return "gold";
  return "silver";
};

loyaltyProgramSchema.pre("validate", function (next) {
  const totalPoints = Number(this.totalPoints || 0);
  const shouldInitializeBalance =
    this.isNew &&
    (this.pointsBalance === undefined ||
      this.pointsBalance === null ||
      this.pointsBalance === 0);

  const currentBalance = shouldInitializeBalance
    ? totalPoints
    : Number(this.pointsBalance ?? totalPoints);

  this.pointsBalance = currentBalance;
  this.tier = getTierFromPoints(this.pointsBalance);
  next();
});

export default mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
