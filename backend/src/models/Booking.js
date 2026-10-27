import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, required: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },
    rooms: [
      {
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType" },
        ratePerNight: Number,
        guests: { adults: Number, children: Number },
        specialRequests: String,
      },
    ],
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    actualCheckIn: Date,
    actualCheckOut: Date,
    nights: { type: Number, required: true },
    totalGuests: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
    },
    pricing: {
      roomCharges: Number,
      extraCharges: [{ description: String, amount: Number }],
      taxes: Number,
      discount: { type: Number, default: 0 },
      discountCode: String,
      totalAmount: Number,
      paidAmount: { type: Number, default: 0 },
      balanceAmount: Number,
      currency: { type: String, default: "USD" },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded", "failed"],
      default: "unpaid",
    },
    source: {
      type: String,
      enum: [
        "direct",
        "website",
        "phone",
        "walk_in",
        "booking_com",
        "expedia",
        "airbnb",
        "agent",
      ],
      default: "direct",
    },
    channelBookingId: String,
    specialRequests: String,
    internalNotes: String,
    cancellation: {
      cancelledAt: Date,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ["pending", "processed", "rejected"],
      },
    },
    checkInDetails: {
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      idProofType: String,
      idProofNumber: String,
      idProofImage: String,
    },
    folio: [
      {
        description: String,
        amount: Number,
        type: { type: String, enum: ["charge", "payment", "refund"] },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    loyaltyPointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ guestId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ "rooms.roomId": 1, checkIn: 1, checkOut: 1 });
// ❌ ይህ መስመር ተወግዷል (Removed): bookingSchema.index({ bookingNumber: 1 }, { unique: true });

// Virtual for overlap detection
bookingSchema.methods.overlaps = function (startDate, endDate) {
  return this.checkIn < endDate && this.checkOut > startDate;
};

export default mongoose.model("Booking", bookingSchema);
