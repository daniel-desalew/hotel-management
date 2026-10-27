import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import { emitToHotel, EVENTS } from "../config/socket.js";

/**
 * Generate unique payment number
 */
const generatePaymentNumber = () => {
  const ts = Date.now().toString().slice(-8);
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `PAY${ts}${rand}`;
};

/**
 * Record a manual/cash payment
 */
export const recordPayment = async ({
  bookingId,
  amount,
  method,
  transactionId,
  gateway = "manual",
  notes,
  userId,
}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (amount <= 0) throw new ApiError(400, "Amount must be positive");
  if (amount > booking.pricing.balanceAmount + 0.01) {
    throw new ApiError(400, "Amount exceeds outstanding balance");
  }

  const payment = await Payment.create({
    paymentNumber: generatePaymentNumber(),
    bookingId,
    hotelId: booking.hotelId,
    guestId: booking.guestId,
    amount,
    method,
    gateway,
    transactionId,
    notes,
    status: "completed",
    type: "payment",
    processedBy: userId,
  });

  await updateBookingPaymentStatus(booking, amount, "add");

  emitToHotel(booking.hotelId, EVENTS.PAYMENT_RECEIVED, payment);
  emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, { type: "payment" });

  return payment;
};

/**
 * Update booking payment status after a payment or refund
 */
const updateBookingPaymentStatus = async (
  booking,
  amount,
  operation = "add",
) => {
  if (operation === "add") {
    booking.pricing.paidAmount =
      (booking.pricing.paidAmount || 0) + Number(amount);
  } else {
    booking.pricing.paidAmount = Math.max(
      0,
      (booking.pricing.paidAmount || 0) - Number(amount),
    );
  }
  booking.pricing.balanceAmount = Math.max(
    0,
    booking.pricing.totalAmount - booking.pricing.paidAmount,
  );

  if (booking.pricing.paidAmount <= 0) {
    booking.paymentStatus = "unpaid";
  } else if (booking.pricing.balanceAmount <= 0.01) {
    booking.paymentStatus = "paid";
  } else {
    booking.paymentStatus = "partial";
  }

  await booking.save();
};

/**
 * Process refund
 */
export const processRefund = async ({ paymentId, amount, reason, userId }) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "completed")
    throw new ApiError(400, "Only completed payments can be refunded");

  const refundAmount = amount || payment.amount;
  if (refundAmount > payment.amount)
    throw new ApiError(400, "Refund cannot exceed payment amount");

  // If using Stripe, call gateway refund here
  // const refund = await stripe.refunds.create({ payment_intent: payment.transactionId });

  const refundType =
    refundAmount === payment.amount ? "refunded" : "partially_refunded";
  payment.status = refundType;
  payment.refund = {
    amount: refundAmount,
    reason: reason || "Refund requested",
    refundedAt: new Date(),
    refundedBy: userId,
  };
  await payment.save();

  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    await updateBookingPaymentStatus(booking, refundAmount, "subtract");
    if (booking.pricing.paidAmount === 0) booking.paymentStatus = "refunded";
    await booking.save();
  }

  emitToHotel(payment.hotelId, EVENTS.PAYMENT_FAILED, {
    type: "refund",
    payment,
  });
  return payment;
};

/**
 * Create Stripe PaymentIntent (placeholder)
 */
export const createStripeIntent = async ({
  bookingId,
  amount,
  currency = "usd",
}) => {
  // const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
  // const intent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100),
  //   currency,
  //   metadata: { bookingId: bookingId.toString() },
  // });
  // return intent;

  throw new ApiError(501, "Stripe integration not configured yet");
};

/**
 * Verify Stripe webhook
 */
export const verifyStripeWebhook = (rawBody, signature) => {
  // const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
  // return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  throw new ApiError(501, "Stripe webhook not configured");
};

/**
 * Payment summary for a booking
 */
export const getBookingPaymentSummary = async (bookingId) => {
  const [payments, booking] = await Promise.all([
    Payment.find({ bookingId }).sort({ createdAt: -1 }),
    Booking.findById(bookingId),
  ]);
  if (!booking) throw new ApiError(404, "Booking not found");

  const totalPaid = payments
    .filter((p) => ["completed", "partially_refunded"].includes(p.status))
    .reduce((sum, p) => sum + p.amount - (p.refund?.amount || 0), 0);

  return {
    bookingTotal: booking.pricing.totalAmount,
    totalPaid,
    balance: booking.pricing.balanceAmount,
    paymentStatus: booking.paymentStatus,
    payments,
  };
};

/**
 * Daily revenue for a hotel
 */
export const getDailyRevenue = async (hotelId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const result = await Payment.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        status: "completed",
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$method",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const total = result.reduce((sum, r) => sum + r.total, 0);
  return { date, total, byMethod: result };
};
