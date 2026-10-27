import crypto from "crypto";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToHotel, emitToUser, EVENTS } from "../config/socket.js";
import { sendNotificationToHotel } from "./notificationController.js";

// @desc   Record payment
// @route  POST /api/v1/payments
export const createPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, method, transactionId, gateway, notes } =
      req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");

    const paymentNumber =
      "PAY" + Date.now() + crypto.randomBytes(2).toString("hex").toUpperCase();

    const payment = await Payment.create({
      paymentNumber,
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
      processedBy: req.user._id,
    });

    // Update booking payment info
    booking.pricing.paidAmount =
      (booking.pricing.paidAmount || 0) + Number(amount);
    booking.pricing.balanceAmount =
      booking.pricing.totalAmount - booking.pricing.paidAmount;

    if (booking.pricing.balanceAmount <= 0) {
      booking.paymentStatus = "paid";
    } else if (booking.pricing.paidAmount > 0) {
      booking.paymentStatus = "partial";
    }

    await booking.save();

    emitToHotel(booking.hotelId, EVENTS.PAYMENT_RECEIVED, payment);
    emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, { type: "payment" });
    await sendNotificationToHotel({
      hotelId: booking.hotelId,
      type: "payment_received",
      title: "Payment received",
      message: `A payment of ${payment.amount} ${payment.currency || ""} was recorded.`,
      data: { paymentId: payment._id, bookingId: booking._id },
      priority: "normal",
    });

    res.status(201).json(new ApiResponse(201, payment, "Payment recorded"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get all payments
// @route  GET /api/v1/payments
export const getAllPayments = async (req, res, next) => {
  try {
    const { hotelId, bookingId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (hotelId) filter.hotelId = hotelId;
    if (bookingId) filter.bookingId = bookingId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("bookingId", "bookingNumber")
        .populate("guestId", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            payments,
            pagination: {
              total,
              page: Number(page),
              pages: Math.ceil(total / limit),
            },
          },
          "Payments fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single payment
// @route  GET /api/v1/payments/:id
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("bookingId");
    if (!payment) throw new ApiError(404, "Payment not found");
    res.status(200).json(new ApiResponse(200, payment, "Payment fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Refund payment
// @route  POST /api/v1/payments/:id/refund
export const refundPayment = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new ApiError(404, "Payment not found");
    if (payment.status !== "completed")
      throw new ApiError(400, "Only completed payments can be refunded");

    payment.status = "refunded";
    payment.refund = {
      amount: amount || payment.amount,
      reason: reason || "Refund requested",
      refundedAt: new Date(),
      refundedBy: req.user._id,
    };
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.pricing.paidAmount -= payment.refund.amount;
      booking.pricing.balanceAmount =
        booking.pricing.totalAmount - booking.pricing.paidAmount;
      booking.paymentStatus =
        booking.pricing.paidAmount <= 0 ? "refunded" : "partial";
      await booking.save();
    }

    emitToHotel(payment.hotelId, EVENTS.PAYMENT_FAILED, {
      type: "refund",
      payment,
    });
    res.status(200).json(new ApiResponse(200, payment, "Payment refunded"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get payment summary for a booking
// @route  GET /api/v1/payments/booking/:bookingId/summary
export const getBookingPaymentSummary = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      bookingId: req.params.bookingId,
      status: "completed",
    });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { payments, totalPaid, count: payments.length },
          "Summary fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};
