// backend/src/controllers/dashboardController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Guest from "../models/Guest.js";
import Payment from "../models/Payment.js";
import Housekeeping from "../models/Housekeeping.js";
import Hotel from "../models/Hotel.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const resolveHotelId = async (req) => {
  const fromQuery = req.query.hotelId;
  const fromUser = req.user?.hotelId;

  if (fromQuery && typeof fromQuery === "string" && fromQuery.length === 24) {
    return fromQuery;
  }
  if (fromUser && fromUser.toString().length === 24) {
    return fromUser.toString();
  }

  const firstHotel = await Hotel.findOne({ isActive: true }).select("_id");
  if (!firstHotel) throw new ApiError(400, "No hotel available in the system");
  return firstHotel._id.toString();
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const hotelId = await resolveHotelId(req);
    console.log("📊 Dashboard using hotelId:", hotelId);

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRooms,
      occupiedRooms,
      todayCheckIns,
      todayCheckOuts,
      pendingHousekeeping,
      totalGuests,
      todayRevenue,
      monthlyRevenue,
      recentBookings,
      roomsByStatus,
    ] = await Promise.all([
      Room.countDocuments({ hotelId: hotelObjectId, isActive: true }),
      Room.countDocuments({ hotelId: hotelObjectId, status: "occupied" }),
      Booking.countDocuments({
        hotelId: hotelObjectId,
        checkIn: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "pending"] },
      }),
      Booking.countDocuments({
        hotelId: hotelObjectId,
        checkOut: { $gte: today, $lt: tomorrow },
        status: "checked_in",
      }),
      Housekeeping.countDocuments({
        hotelId: hotelObjectId,
        status: { $in: ["pending", "in_progress"] },
      }),
      Guest.countDocuments({}),
      Payment.aggregate([
        {
          $match: {
            hotelId: hotelObjectId,
            status: "completed",
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            hotelId: hotelObjectId,
            status: "completed",
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.find({ hotelId: hotelObjectId })
        .populate("guestId", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5),
      Room.aggregate([
        { $match: { hotelId: hotelObjectId, isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    console.log("📊 Rooms found:", totalRooms, "Occupied:", occupiedRooms);

    const occupancyRate = totalRooms
      ? Math.round((occupiedRooms / totalRooms) * 10000) / 100
      : 0;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          kpis: {
            totalRooms,
            occupiedRooms,
            availableRooms: totalRooms - occupiedRooms,
            occupancyRate,
            todayCheckIns,
            todayCheckOuts,
            pendingHousekeeping,
            totalGuests,
            todayRevenue: todayRevenue[0]?.total || 0,
            monthlyRevenue: monthlyRevenue[0]?.total || 0,
          },
          recentBookings,
          roomsByStatus,
        },
        "Dashboard metrics fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getRevenueChart = async (req, res, next) => {
  try {
    const hotelId = await resolveHotelId(req);
    const days = Number(req.query.days) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const data = await Payment.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: "completed",
          createdAt: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(new ApiResponse(200, data, "Revenue chart data"));
  } catch (error) {
    next(error);
  }
};

export const getOccupancyChart = async (req, res, next) => {
  try {
    const hotelId = await resolveHotelId(req);
    const days = Number(req.query.days) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const totalRooms = await Room.countDocuments({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      isActive: true,
    });

    const data = await Booking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          status: { $in: ["checked_in", "checked_out"] },
          checkIn: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
          occupied: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = data.map((d) => ({
      date: d._id,
      occupied: d.occupied,
      totalRooms,
      rate: totalRooms
        ? Math.round((d.occupied / totalRooms) * 10000) / 100
        : 0,
    }));

    res
      .status(200)
      .json(new ApiResponse(200, formatted, "Occupancy chart data"));
  } catch (error) {
    next(error);
  }
};

export const getTodayActivity = async (req, res, next) => {
  try {
    const hotelId = await resolveHotelId(req);
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [arrivals, departures, inHouse] = await Promise.all([
      Booking.find({
        hotelId: hotelObjectId,
        checkIn: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "pending"] },
      }),
      Booking.find({
        hotelId: hotelObjectId,
        checkOut: { $gte: today, $lt: tomorrow },
        status: "checked_in",
      }),
      Booking.find({ hotelId: hotelObjectId, status: "checked_in" }),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { arrivals, departures, inHouse },
          "Today's activity",
        ),
      );
  } catch (error) {
    next(error);
  }
};
