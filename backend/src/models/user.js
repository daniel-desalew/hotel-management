import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: [
        "super_admin",
        "hotel_admin",
        "manager",
        "receptionist",
        "housekeeping",
        "guest",
      ],
      default: "guest",
    },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    avatar: String,
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokens: [{ token: String, createdAt: Date }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    preferences: {
      language: { type: String, default: "en" },
      currency: { type: String, default: "USD" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ hotelId: 1, role: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, hotelId: this.hotelId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export default mongoose.model("User", userSchema);
