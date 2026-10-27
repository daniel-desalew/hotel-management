// backend/src/controllers/bookingController.js
import crypto from "crypto";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import RoomType from "../models/RoomType.js";
import Guest from "../models/Guest.js";
import Hotel from "../models/Hotel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToHotel, EVENTS } from "../config/socket.js";
import { sendNotificationToHotel } from "./notificationController.js";

// ─────────────────────────────────────────────────────────────
// Helper: Find available rooms
// ─────────────────────────────────────────────────────────────
const findAvailableRooms = async (
  hotelId,
  checkIn,
  checkOut,
  roomTypeId = null,
) => {
  const bookedRoomIds = await Booking.distinct("rooms.roomId", {
    hotelId,
    status: { $in: ["confirmed", "checked_in", "pending"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  const filter = {
    hotelId,
    isActive: true,
    status: { $nin: ["maintenance", "out_of_order"] },
    _id: { $nin: bookedRoomIds },
  };
  if (roomTypeId) filter.roomTypeId = roomTypeId;

  return Room.find(filter).populate("roomTypeId");
};

// ─────────────────────────────────────────────────────────────
// @desc   Check availability
// @route  POST /api/v1/bookings/check-availability
// ─────────────────────────────────────────────────────────────
export const checkAvailability = async (req, res, next) => {
  try {
    const { hotelId, checkIn, checkOut, roomTypeId } = req.body;
    if (!hotelId || !checkIn || !checkOut) {
      throw new ApiError(400, "Missing required fields");
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      throw new ApiError(400, "Invalid date range");
    }

    const rooms = await findAvailableRooms(
      hotelId,
      checkInDate,
      checkOutDate,
      roomTypeId,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, { availableRooms: rooms }, "Availability checked"),
      );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Create booking
// @route  POST /api/v1/bookings
// ─────────────────────────────────────────────────────────────
export const createBooking = async (req, res, next) => {
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
    } = req.body;

    if (
      !hotelId ||
      !guestId ||
      !roomTypeId ||
      !checkIn ||
      !checkOut ||
      !adults
    ) {
      throw new ApiError(400, "Missing required booking fields");
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate)
      throw new ApiError(400, "Invalid date range");

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
    );

    // Find available room
    const availableRooms = await findAvailableRooms(
      hotelId,
      checkInDate,
      checkOutDate,
      roomTypeId,
    );
    if (!availableRooms.length)
      throw new ApiError(409, "No rooms available for selected dates");

    const room = availableRooms[0];

    // Calculate price
    const hotel = await Hotel.findById(hotelId);
    const roomCharges = room.roomTypeId.basePrice * nights;
    const taxes = roomCharges * ((hotel?.taxRate || 10) / 100);
    const totalAmount = roomCharges + taxes;

    // Generate booking number
    const bookingNumber =
      "BK" + Date.now() + crypto.randomBytes(2).toString("hex").toUpperCase();

    const booking = await Booking.create({
      bookingNumber,
      hotelId,
      guestId,
      rooms: [
        {
          roomId: room._id,
          roomTypeId: room.roomTypeId._id,
          ratePerNight: room.roomTypeId.basePrice,
          guests: { adults, children },
          specialRequests,
        },
      ],
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalGuests: { adults, children },
      pricing: {
        roomCharges,
        taxes,
        totalAmount,
        balanceAmount: totalAmount,
      },
      status: "pending",
      paymentStatus: "unpaid",
      source,
      specialRequests,
    });

    // Reserve the room
    await Room.findByIdAndUpdate(room._id, {
      status: "reserved",
      currentBookingId: booking._id,
    });

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("rooms.roomId")
      .populate("rooms.roomTypeId");

    // Real-time notify hotel
    emitToHotel(hotelId, EVENTS.BOOKING_CREATED, populated);
    emitToHotel(hotelId, EVENTS.DASHBOARD_REFRESH, { type: "new_booking" });

    // 🔔 Send notification to hotel staff
    try {
      await sendNotificationToHotel({
        hotelId,
        type: "booking_created",
        title: "🎉 New Booking",
        message: `${populated.guestId?.firstName || "Guest"} booked ${
          populated.rooms?.[0]?.roomTypeId?.name || "a room"
        } for ${populated.nights} night(s)`,
        data: {
          bookingId: populated._id,
          bookingNumber: populated.bookingNumber,
        },
        priority: "high",
      });
    } catch (err) {
      console.error("Notification failed:", err.message);
    }

    res.status(201).json(new ApiResponse(201, populated, "Booking created"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Get all bookings
// @route  GET /api/v1/bookings
// ─────────────────────────────────────────────────────────────
export const getAllBookings = async (req, res, next) => {
  try {
    const {
      hotelId,
      status,
      source,
      guestName,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = { $in: String(status).split(",") };
    if (source) filter.source = source;
    if (fromDate || toDate) {
      filter.checkIn = {};
      if (fromDate) filter.checkIn.$gte = new Date(fromDate);
      if (toDate) filter.checkIn.$lte = new Date(toDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    let [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("guestId", "firstName lastName email phone")
        .populate("rooms.roomId", "roomNumber floor")
        .populate("rooms.roomTypeId", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    // Filter by guest name (post-query)
    if (guestName) {
      const regex = new RegExp(guestName, "i");
      bookings = bookings.filter(
        (b) =>
          regex.test(b.guestId?.firstName || "") ||
          regex.test(b.guestId?.lastName || "") ||
          regex.test(b.bookingNumber),
      );
      total = bookings.length;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookings,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Bookings fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Get single booking
// @route  GET /api/v1/bookings/:id
// ─────────────────────────────────────────────────────────────
export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("guestId")
      .populate("rooms.roomId")
      .populate("rooms.roomTypeId")
      .populate("hotelId", "name code address");
    if (!booking) throw new ApiError(404, "Booking not found");
    res.status(200).json(new ApiResponse(200, booking, "Booking fetched"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Update booking
// @route  PATCH /api/v1/bookings/:id
// ─────────────────────────────────────────────────────────────
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!booking) throw new ApiError(404, "Booking not found");

    emitToHotel(booking.hotelId, EVENTS.BOOKING_UPDATED, booking);
    res.status(200).json(new ApiResponse(200, booking, "Booking updated"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Check-in
// @route  POST /api/v1/bookings/:id/check-in
// ─────────────────────────────────────────────────────────────
export const checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status === "checked_in")
      throw new ApiError(400, "Already checked in");
    if (["cancelled", "no_show"].includes(booking.status)) {
      throw new ApiError(400, "Cannot check in a cancelled booking");
    }

    booking.status = "checked_in";
    booking.actualCheckIn = new Date();
    booking.checkInDetails = { ...req.body, checkedInBy: req.user._id };
    await booking.save();

    // Update all rooms in this booking
    await Promise.all(
      booking.rooms.map((r) =>
        Room.findByIdAndUpdate(r.roomId, {
          status: "occupied",
          housekeepingStatus: "clean",
          currentBookingId: booking._id,
        }),
      ),
    );

    emitToHotel(booking.hotelId, EVENTS.CHECK_IN, booking);
    emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, {
      type: "check_in",
    });

    // 🔔 Notify hotel
    try {
      await sendNotificationToHotel({
        hotelId: booking.hotelId,
        type: "check_in",
        title: "✅ Guest Checked In",
        message: `${booking.bookingNumber} checked in successfully`,
        data: { bookingId: booking._id },
      });
    } catch (err) {
      console.error("Notification failed:", err.message);
    }

    res
      .status(200)
      .json(new ApiResponse(200, booking, "Checked in successfully"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Check-out
// @route  POST /api/v1/bookings/:id/check-out
// ─────────────────────────────────────────────────────────────
export const checkOut = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status !== "checked_in") {
      throw new ApiError(400, "Booking is not checked in");
    }

    booking.status = "checked_out";
    booking.actualCheckOut = new Date();
    await booking.save();

    await Promise.all(
      booking.rooms.map((r) =>
        Room.findByIdAndUpdate(r.roomId, {
          status: "cleaning",
          housekeepingStatus: "dirty",
          currentBookingId: null,
        }),
      ),
    );

    emitToHotel(booking.hotelId, EVENTS.CHECK_OUT, booking);
    emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, {
      type: "check_out",
    });

    // 🔔 Notify hotel
    try {
      await sendNotificationToHotel({
        hotelId: booking.hotelId,
        type: "check_out",
        title: "👋 Guest Checked Out",
        message: `${booking.bookingNumber} checked out`,
        data: { bookingId: booking._id },
      });
    } catch (err) {
      console.error("Notification failed:", err.message);
    }

    res
      .status(200)
      .json(new ApiResponse(200, booking, "Checked out successfully"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Cancel booking
// @route  POST /api/v1/bookings/:id/cancel
// ─────────────────────────────────────────────────────────────
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (["cancelled", "checked_out"].includes(booking.status)) {
      throw new ApiError(400, "Cannot cancel this booking");
    }

    booking.status = "cancelled";
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user?._id,
      reason: req.body.reason || "No reason provided",
    };
    await booking.save();

    await Promise.all(
      booking.rooms.map((r) =>
        Room.findByIdAndUpdate(r.roomId, {
          status: "available",
          currentBookingId: null,
        }),
      ),
    );

    emitToHotel(booking.hotelId, EVENTS.BOOKING_CANCELLED, booking);

    // 🔔 Notify hotel
    try {
      await sendNotificationToHotel({
        hotelId: booking.hotelId,
        type: "booking_cancelled",
        title: "❌ Booking Cancelled",
        message: `${booking.bookingNumber} was cancelled`,
        data: { bookingId: booking._id },
        priority: "high",
      });
    } catch (err) {
      console.error("Notification failed:", err.message);
    }

    res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Get bookings for a guest
// @route  GET /api/v1/bookings/guest/:guestId
// ─────────────────────────────────────────────────────────────
export const getGuestBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ guestId: req.params.guestId })
      .populate("hotelId", "name code")
      .populate("rooms.roomTypeId", "name code")
      .sort({ checkIn: -1 });
    res
      .status(200)
      .json(new ApiResponse(200, bookings, "Guest bookings fetched"));
  } catch (error) {
    next(error);
  }
};
