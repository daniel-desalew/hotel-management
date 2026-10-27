import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    method: {
      type: String,
      enum: [
        "cash",
        "credit_card",
        "debit_card",
        "upi",
        "net_banking",
        "wallet",
        "bank_transfer",
      ],
      required: true,
    },
    gateway: { type: String, enum: ["stripe", "razorpay", "paypal", "manual"] },
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ["payment", "refund", "deposit"],
      default: "payment",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },
    refund: {
      amount: Number,
      reason: String,
      refundId: String,
      refundedAt: Date,
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
  },
  { timestamps: true },
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ transactionId: 1 });

export default mongoose.model("Payment", paymentSchema);
