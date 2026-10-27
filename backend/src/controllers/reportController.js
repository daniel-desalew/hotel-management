import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Room from "../models/Room.js";
import Guest from "../models/Guest.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// @desc   Revenue report
// @route  GET /api/v1/reports/revenue
export const getRevenueReport = async (req, res, next) => {
  try {
    const { hotelId, fromDate, toDate, groupBy = "day" } = req.query;
    if (!hotelId) throw new ApiError(400, "hotelId is required");

    const match = {
      hotelId: new mongoose.Types.ObjectId(hotelId),
      status: { $in: ["checked_in", "checked_out"] },
    };
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const dateFormat =
      groupBy === "month" ? "%Y-%m" : groupBy === "week" ? "%Y-%U" : "%Y-%m-%d";

    const report = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$pricing.totalAmount" },
          bookings: { $sum: 1 },
          nights: { $sum: "$nights" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = report.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.revenue,
        bookings: acc.bookings + r.bookings,
      }),
      { revenue: 0, bookings: 0 },
    );

    res
      .status(200)
      .json(new ApiResponse(200, { report, totals }, "Revenue report"));
  } catch (error) {
    next(error);
  }
};

// @desc   Occupancy report
// @route  GET /api/v1/reports/occupancy
export const getOccupancyReport = async (req, res, next) => {
  try {
    const { hotelId, fromDate, toDate } = req.query;
    if (!hotelId) throw new ApiError(400, "hotelId is required");

    const totalRooms = await Room.countDocuments({ hotelId, isActive: true });

    const match = { hotelId: new mongoose.Types.ObjectId(hotelId) };
    if (fromDate || toDate) {
      match.checkIn = {};
      if (fromDate) match.checkIn.$gte = new Date(fromDate);
      if (toDate) match.checkIn.$lte = new Date(toDate);
    }

    const occupancy = await Booking.aggregate([
      { $match: { ...match, status: { $in: ["checked_in", "checked_out"] } } },
      { $unwind: "$rooms" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
          occupiedRooms: { $sum: 1 },
          guests: { $sum: "$totalGuests.adults" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const report = occupancy.map((o) => ({
      date: o._id,
      occupied: o.occupiedRooms,
      totalRooms,
      occupancyRate: totalRooms
        ? Math.round((o.occupiedRooms / totalRooms) * 10000) / 100
        : 0,
      guests: o.guests,
    }));

    res
      .status(200)
      .json(new ApiResponse(200, { totalRooms, report }, "Occupancy report"));
  } catch (error) {
    next(error);
  }
};

// @desc   Guest statistics report
// @route  GET /api/v1/reports/guests
export const getGuestReport = async (req, res, next) => {
  try {
    const { hotelId, fromDate, toDate } = req.query;
    const match = {};
    if (hotelId) match.hotelId = new mongoose.Types.ObjectId(hotelId);
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const report = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalGuests: {
            $sum: { $add: ["$totalGuests.adults", "$totalGuests.children"] },
          },
          avgNights: { $avg: "$nights" },
          avgSpend: { $avg: "$pricing.totalAmount" },
        },
      },
    ]);

    res.status(200).json(new ApiResponse(200, report[0] || {}, "Guest report"));
  } catch (error) {
    next(error);
  }
};

// @desc   Room type performance
// @route  GET /api/v1/reports/room-types
export const getRoomTypeReport = async (req, res, next) => {
  try {
    const { hotelId, fromDate, toDate } = req.query;
    const match = {};
    if (hotelId) match.hotelId = new mongoose.Types.ObjectId(hotelId);
    match.status = { $in: ["checked_in", "checked_out"] };
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const report = await Booking.aggregate([
      { $match: match },
      { $unwind: "$rooms" },
      {
        $group: {
          _id: "$rooms.roomTypeId",
          bookings: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" },
          avgRate: { $avg: "$rooms.ratePerNight" },
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
      { $unwind: { path: "$roomType", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          roomTypeId: "$_id",
          name: "$roomType.name",
          code: "$roomType.code",
          bookings: 1,
          revenue: 1,
          avgRate: { $round: ["$avgRate", 2] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json(new ApiResponse(200, report, "Room type report"));
  } catch (error) {
    next(error);
  }
};

// @desc   Source performance
// @route  GET /api/v1/reports/sources
export const getSourceReport = async (req, res, next) => {
  try {
    const { hotelId, fromDate, toDate } = req.query;
    const match = {};
    if (hotelId) match.hotelId = new mongoose.Types.ObjectId(hotelId);
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const report = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$source",
          bookings: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json(new ApiResponse(200, report, "Source report"));
  } catch (error) {
    next(error);
  }
};
