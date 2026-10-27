import crypto from "crypto";
import mongoose from "mongoose";
import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import RoomType from "../models/RoomType.js";
import Guest from "../models/Guest.js";
import Hotel from "../models/Hotel.js";
import ApiError from "../utils/ApiError.js";
import {
  findAvailableRooms,
  isRoomAvailable,
  suggestBestRoom,
} from "./availabilityService.js";
import { calculateBookingPrice, applyDiscountCode } from "./pricingService.js";
import { emitToHotel, EVENTS } from "../config/socket.js";

/**
 * Generate unique booking number
 */
const generateBookingNumber = () => {
  const ts = Date.now().toString().slice(-8);
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `BK${ts}${rand}`;
};

/**
 * Create a new booking (with transaction)
 */
export const createBooking = async (bookingData, user = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      hotelId,
      guestId,
      roomTypeId,
      checkIn,
      checkOut,
      adults,
      children = 0,
      source = "direct",
      specialRequests,
      discountCode,
    } = bookingData;

    // Validate dates
    const checkInDate = dayjs(checkIn).toDate();
    const checkOutDate = dayjs(checkOut).toDate();
    if (checkInDate >= checkOutDate)
      throw new ApiError(400, "Check-out must be after check-in");
    if (dayjs(checkInDate).isBefore(dayjs().startOf("day")))
      throw new ApiError(400, "Check-in cannot be in the past");

    // Validate hotel + room type
    const [hotel, roomType, guest] = await Promise.all([
      Hotel.findById(hotelId).session(session),
      RoomType.findById(roomTypeId).session(session),
      Guest.findById(guestId).session(session),
    ]);
    if (!hotel) throw new ApiError(404, "Hotel not found");
    if (!roomType) throw new ApiError(404, "Room type not found");
    if (!guest) throw new ApiError(404, "Guest not found");

    // Validate occupancy
    if (adults + children > roomType.maxOccupancy) {
      throw new ApiError(
        400,
        `Max occupancy for ${roomType.name} is ${roomType.maxOccupancy}`,
      );
    }

    // Check availability
    const available = await findAvailableRooms(
      hotelId,
      checkInDate,
      checkOutDate,
      roomTypeId,
    );
    if (!available.length)
      throw new ApiError(409, "No rooms available for selected dates");

    const room = available[0];
    const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");

    // Pricing
    const discount = applyDiscountCode(discountCode, nights);
    const pricing = await calculateBookingPrice({
      roomTypeId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      children,
      hotelTaxRate: hotel.taxRate,
      discountCode,
      discountPercentage: discount?.percentage || 0,
    });

    // Create booking
    const [booking] = await Booking.create(
      [
        {
          bookingNumber: generateBookingNumber(),
          hotelId,
          guestId,
          rooms: [
            {
              roomId: room._id,
              roomTypeId,
              ratePerNight: pricing.roomCharges / nights,
              guests: { adults, children },
              specialRequests,
            },
          ],
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          totalGuests: { adults, children },
          pricing: {
            roomCharges: pricing.roomCharges,
            taxes: pricing.taxes,
            discount: pricing.discount,
            discountCode: discountCode?.toUpperCase(),
            totalAmount: pricing.totalAmount,
            paidAmount: 0,
            balanceAmount: pricing.totalAmount,
            currency: pricing.currency,
          },
          status: "pending",
          paymentStatus: "unpaid",
          source,
          specialRequests,
        },
      ],
      { session },
    );

    // Reserve room
    await Room.findByIdAndUpdate(
      room._id,
      { status: "reserved", currentBookingId: booking._id },
      { session },
    );

    await session.commitTransaction();

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("rooms.roomId")
      .populate("rooms.roomTypeId");

    // Realtime
    emitToHotel(hotelId, EVENTS.BOOKING_CREATED, populated);
    emitToHotel(hotelId, EVENTS.DASHBOARD_REFRESH, { type: "new_booking" });

    return populated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Confirm a pending booking
 */
export const confirmBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending")
    throw new ApiError(400, "Booking cannot be confirmed");

  booking.status = "confirmed";
  await booking.save();

  emitToHotel(booking.hotelId, EVENTS.BOOKING_UPDATED, booking);
  return booking;
};

/**
 * Check-in flow
 */
export const performCheckIn = async (bookingId, checkInDetails, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "checked_in")
    throw new ApiError(400, "Already checked in");
  if (["cancelled", "no_show"].includes(booking.status))
    throw new ApiError(400, "Cannot check in a cancelled booking");

  booking.status = "checked_in";
  booking.actualCheckIn = new Date();
  booking.checkInDetails = { ...checkInDetails, checkedInBy: userId };
  await booking.save();

  // Mark rooms occupied
  await Promise.all(
    booking.rooms.map((r) =>
      Room.findByIdAndUpdate(r.roomId, {
        status: "occupied",
        housekeepingStatus: "clean",
        currentBookingId: booking._id,
      }),
    ),
  );

  // Update guest stats
  await Guest.findByIdAndUpdate(booking.guestId, {
    $inc: { "loyalty.totalStays": 1 },
  });

  emitToHotel(booking.hotelId, EVENTS.CHECK_IN, booking);
  emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, { type: "check_in" });

  return booking;
};

/**
 * Check-out flow
 */
export const performCheckOut = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "checked_in")
    throw new ApiError(400, "Booking is not checked in");

  booking.status = "checked_out";
  booking.actualCheckOut = new Date();

  // Loyalty points earned = 1 point per $10 spent
  booking.loyaltyPointsEarned = Math.floor(booking.pricing.totalAmount / 10);
  await booking.save();

  // Update rooms: cleaning
  await Promise.all(
    booking.rooms.map((r) =>
      Room.findByIdAndUpdate(r.roomId, {
        status: "cleaning",
        housekeepingStatus: "dirty",
        currentBookingId: null,
      }),
    ),
  );

  // Update guest loyalty
  await Guest.findByIdAndUpdate(booking.guestId, {
    $inc: {
      "loyalty.points": booking.loyaltyPointsEarned,
      "loyalty.totalSpent": booking.pricing.totalAmount,
    },
  });

  emitToHotel(booking.hotelId, EVENTS.CHECK_OUT, booking);
  emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, { type: "check_out" });

  return booking;
};

/**
 * Cancel booking with refund calculation
 */
export const cancelBooking = async (bookingId, reason, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (["cancelled", "checked_out"].includes(booking.status))
    throw new ApiError(400, "Cannot cancel this booking");

  const { calculateRefund } = await import("./pricingService.js");
  const refund = calculateRefund(booking);

  booking.status = "cancelled";
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason: reason || "No reason provided",
    refundAmount: refund.amount,
    refundStatus: refund.amount > 0 ? "pending" : "rejected",
  };
  await booking.save();

  // Release rooms
  await Promise.all(
    booking.rooms.map((r) =>
      Room.findByIdAndUpdate(r.roomId, {
        status: "available",
        currentBookingId: null,
      }),
    ),
  );

  emitToHotel(booking.hotelId, EVENTS.BOOKING_CANCELLED, booking);
  return booking;
};

/**
 * Modify booking dates (if available)
 */
export const modifyBooking = async (bookingId, updates) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "checked_in")
    throw new ApiError(400, "Cannot modify after check-in");

  if (updates.checkIn || updates.checkOut) {
    const newIn = updates.checkIn
      ? dayjs(updates.checkIn).toDate()
      : booking.checkIn;
    const newOut = updates.checkOut
      ? dayjs(updates.checkOut).toDate()
      : booking.checkOut;
    if (newIn >= newOut) throw new ApiError(400, "Invalid dates");

    // Check availability excluding this booking
    const roomId = booking.rooms[0].roomId;
    const available = await isRoomAvailable(roomId, newIn, newOut, booking._id);
    if (!available) throw new ApiError(409, "Room not available for new dates");

    booking.checkIn = newIn;
    booking.checkOut = newOut;
    booking.nights = dayjs(newOut).diff(dayjs(newIn), "day");
  }

  if (updates.specialRequests)
    booking.specialRequests = updates.specialRequests;
  await booking.save();

  emitToHotel(booking.hotelId, EVENTS.BOOKING_UPDATED, booking);
  return booking;
};

/**
 * Get booking statistics for a hotel
 */
export const getBookingStats = async (hotelId, fromDate, toDate) => {
  const match = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  const stats = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$pricing.totalAmount" },
      },
    },
  ]);

  return stats;
};
