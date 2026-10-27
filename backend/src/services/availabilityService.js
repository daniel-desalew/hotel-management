import mongoose from "mongoose";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import RoomType from "../models/RoomType.js";
import ApiError from "../utils/ApiError.js";

/**
 * Find all room IDs that are booked during the given date range
 * Overlap rule: existingBooking.checkIn < newCheckOut AND existingBooking.checkOut > newCheckIn
 */
export const getBookedRoomIds = async (
  hotelId,
  checkIn,
  checkOut,
  excludeBookingId = null,
) => {
  const filter = {
    hotelId,
    status: { $in: ["confirmed", "checked_in", "pending"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const bookedIds = await Booking.distinct("rooms.roomId", filter);
  return bookedIds;
};

/**
 * Find available rooms for a date range
 */
export const findAvailableRooms = async (
  hotelId,
  checkIn,
  checkOut,
  roomTypeId = null,
) => {
  const bookedRoomIds = await getBookedRoomIds(hotelId, checkIn, checkOut);

  const filter = {
    hotelId,
    isActive: true,
    status: { $nin: ["maintenance", "out_of_order"] },
    _id: { $nin: bookedRoomIds },
  };
  if (roomTypeId) filter.roomTypeId = roomTypeId;

  return Room.find(filter).populate("roomTypeId").sort({ roomNumber: 1 });
};

/**
 * Check if a specific room is available for a date range
 */
export const isRoomAvailable = async (
  roomId,
  checkIn,
  checkOut,
  excludeBookingId = null,
) => {
  const filter = {
    "rooms.roomId": roomId,
    status: { $in: ["confirmed", "checked_in", "pending"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const conflict = await Booking.findOne(filter);
  return !conflict;
};

/**
 * Count available rooms by room type
 */
export const getAvailabilityByRoomType = async (hotelId, checkIn, checkOut) => {
  const bookedRoomIds = await getBookedRoomIds(hotelId, checkIn, checkOut);

  const result = await Room.aggregate([
    {
      $match: {
        hotelId: new mongoose.Types.ObjectId(hotelId),
        isActive: true,
        status: { $nin: ["maintenance", "out_of_order"] },
        _id: {
          $nin: bookedRoomIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    {
      $group: {
        _id: "$roomTypeId",
        availableCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "roomtypes",
        localField: "_id",
        foreignField: "_id",
        as: "roomType",
      },
    },
    { $unwind: "$roomType" },
    {
      $project: {
        _id: 0,
        roomTypeId: "$_id",
        name: "$roomType.name",
        code: "$roomType.code",
        basePrice: "$roomType.basePrice",
        maxOccupancy: "$roomType.maxOccupancy",
        availableCount: 1,
      },
    },
  ]);

  return result;
};

/**
 * Get room calendar for a specific month
 */
export const getRoomCalendar = async (hotelId, roomId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const bookings = await Booking.find({
    hotelId,
    "rooms.roomId": roomId,
    status: { $in: ["confirmed", "checked_in", "pending"] },
    checkIn: { $lte: endDate },
    checkOut: { $gte: startDate },
  })
    .select("bookingNumber checkIn checkOut status totalGuests guestId")
    .populate("guestId", "firstName lastName")
    .sort({ checkIn: 1 });

  return bookings;
};

/**
 * Auto-assign best room for a booking request
 * Priority: matching type, floor preference, cheapest price
 */
export const suggestBestRoom = async (
  hotelId,
  roomTypeId,
  checkIn,
  checkOut,
  preferences = {},
) => {
  const available = await findAvailableRooms(
    hotelId,
    checkIn,
    checkOut,
    roomTypeId,
  );
  if (!available.length) return null;

  // Score each room based on preferences
  const scored = available.map((room) => {
    let score = 0;
    if (preferences.floor && room.floor === preferences.floor) score += 10;
    if (preferences.features?.length) {
      const matches = room.features.filter((f) =>
        preferences.features.includes(f),
      ).length;
      score += matches * 5;
    }
    return { room, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].room;
};

/**
 * Get occupancy summary for a hotel on a specific date
 */
export const getOccupancyOnDate = async (hotelId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const [totalRooms, occupied] = await Promise.all([
    Room.countDocuments({ hotelId, isActive: true }),
    Booking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: "checked_in",
          checkIn: { $lte: end },
          checkOut: { $gte: start },
        },
      },
      { $unwind: "$rooms" },
      { $count: "count" },
    ]),
  ]);

  const occupiedCount = occupied[0]?.count || 0;
  return {
    date,
    totalRooms,
    occupied: occupiedCount,
    available: totalRooms - occupiedCount,
    occupancyRate: totalRooms
      ? Math.round((occupiedCount / totalRooms) * 10000) / 100
      : 0,
  };
};
