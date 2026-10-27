import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, lowercase: true },
    phone: { type: String, required: true },
    alternatePhone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    nationality: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    idProof: {
      type: {
        type: String,
        enum: ["passport", "driving_license", "national_id", "aadhaar"],
      },
      number: String,
      document: String,
    },
    loyalty: {
      tier: {
        type: String,
        enum: ["none", "silver", "gold", "platinum"],
        default: "none",
      },
      points: { type: Number, default: 0 },
      totalStays: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
    preferences: {
      roomType: String,
      floor: String,
      bedType: String,
      smoking: Boolean,
      dietaryRestrictions: [String],
    },
    notes: String,
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: String,
    tags: [String],
  },
  { timestamps: true },
);

guestSchema.index({ email: 1 });
guestSchema.index({ phone: 1 });

export default mongoose.model("Guest", guestSchema);
