import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Room from "../models/Room.js";
import Guest from "../models/Guest.js";
import Review from "../models/Review.js";

/**
 * Full revenue report with day/month/year grouping
 */
export const getRevenueReport = async (
  hotelId,
  { fromDate, toDate, groupBy = "day" },
) => {
  const match = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: { $in: ["checked_in", "checked_out"] },
  };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  const formats = {
    day: "%Y-%m-%d",
    week: "%Y-%U",
    month: "%Y-%m",
    year: "%Y",
  };
  const fmt = formats[groupBy] || formats.day;

  const [byPeriod, totals] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$createdAt" } },
          revenue: { $sum: "$pricing.totalAmount" },
          tax: { $sum: "$pricing.taxes" },
          discount: { $sum: "$pricing.discount" },
          bookings: { $sum: 1 },
          nights: { $sum: "$nights" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.totalAmount" },
          totalTax: { $sum: "$pricing.taxes" },
          totalDiscount: { $sum: "$pricing.discount" },
          totalBookings: { $sum: 1 },
          totalNights: { $sum: "$nights" },
          avgBookingValue: { $avg: "$pricing.totalAmount" },
        },
      },
    ]),
  ]);

  return {
    groupBy,
    byPeriod,
    totals: totals[0] || {},
  };
};

/**
 * Occupancy report per day
 */
export const getOccupancyReport = async (hotelId, { fromDate, toDate }) => {
  const totalRooms = await Room.countDocuments({ hotelId, isActive: true });

  const match = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: { $in: ["checked_in", "checked_out"] },
  };
  if (fromDate || toDate) {
    match.checkIn = {};
    if (fromDate) match.checkIn.$gte = new Date(fromDate);
    if (toDate) match.checkIn.$lte = new Date(toDate);
  }

  const data = await Booking.aggregate([
    { $match: match },
    { $unwind: "$rooms" },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
        occupied: { $sum: 1 },
        guests: {
          $sum: { $add: ["$totalGuests.adults", "$totalGuests.children"] },
        },
        revenue: { $sum: "$pricing.totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const report = data.map((d) => ({
    date: d._id,
    occupied: d.occupied,
    totalRooms,
    occupancyRate: totalRooms
      ? Math.round((d.occupied / totalRooms) * 10000) / 100
      : 0,
    guests: d.guests,
    revenue: d.revenue,
    adr: d.occupied ? Math.round((d.revenue / d.occupied) * 100) / 100 : 0,
  }));

  const avgOccupancy = report.length
    ? Math.round(
        (report.reduce((s, r) => s + r.occupancyRate, 0) / report.length) * 100,
      ) / 100
    : 0;

  return { totalRooms, avgOccupancy, report };
};

/**
 * RevPAR / ADR report
 */
export const getRevPARReport = async (hotelId, { fromDate, toDate }) => {
  const { report } = await getOccupancyReport(hotelId, { fromDate, toDate });
  return report.map((r) => ({
    date: r.date,
    adr: r.adr, // Average Daily Rate
    revPAR: r.totalRooms
      ? Math.round((r.revenue / r.totalRooms) * 100) / 100
      : 0,
    occupancyRate: r.occupancyRate,
    revenue: r.revenue,
  }));
};

/**
 * Booking source breakdown
 */
export const getSourceReport = async (hotelId, { fromDate, toDate }) => {
  const match = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  const data = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$source",
        bookings: { $sum: 1 },
        revenue: { $sum: "$pricing.totalAmount" },
        avgNights: { $avg: "$nights" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return data.map((d) => ({
    source: d._id,
    bookings: d.bookings,
    revenue: d.revenue,
    avgNights: Math.round(d.avgNights * 10) / 10,
    revenueShare: totalRevenue
      ? Math.round((d.revenue / totalRevenue) * 10000) / 100
      : 0,
  }));
};

/**
 * Room type performance
 */
export const getRoomTypeReport = async (hotelId, { fromDate, toDate }) => {
  const match = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    status: { $in: ["checked_in", "checked_out"] },
  };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  return Booking.aggregate([
    { $match: match },
    { $unwind: "$rooms" },
    {
      $group: {
        _id: "$rooms.roomTypeId",
        bookings: { $sum: 1 },
        revenue: { $sum: "$rooms.ratePerNight" },
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
        totalRooms: "$roomType.totalRooms",
        bookings: 1,
        revenue: 1,
        avgRate: { $round: ["$avgRate", 2] },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
};

/**
 * Guest analytics
 */
export const getGuestAnalytics = async (hotelId, { fromDate, toDate }) => {
  const match = {};
  if (hotelId) match.hotelId = new mongoose.Types.ObjectId(hotelId);
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  const [overall, topGuests, loyaltyTiers] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          uniqueGuests: { $addToSet: "$guestId" },
          totalRevenue: { $sum: "$pricing.totalAmount" },
          avgNights: { $avg: "$nights" },
        },
      },
      {
        $project: {
          totalBookings: 1,
          uniqueGuests: { $size: "$uniqueGuests" },
          totalRevenue: 1,
          avgNights: { $round: ["$avgNights", 1] },
        },
      },
    ]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$guestId",
          bookings: { $sum: 1 },
          spent: { $sum: "$pricing.totalAmount" },
        },
      },
      { $sort: { spent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "guests",
          localField: "_id",
          foreignField: "_id",
          as: "guest",
        },
      },
      { $unwind: "$guest" },
      {
        $project: {
          _id: 0,
          guestId: "$_id",
          name: { $concat: ["$guest.firstName", " ", "$guest.lastName"] },
          email: "$guest.email",
          bookings: 1,
          spent: 1,
        },
      },
    ]),
    Guest.aggregate([{ $group: { _id: "$loyalty.tier", count: { $sum: 1 } } }]),
  ]);

  return {
    overall: overall[0] || {
      totalBookings: 0,
      uniqueGuests: 0,
      totalRevenue: 0,
      avgNights: 0,
    },
    topGuests,
    loyaltyTiers,
  };
};

/**
 * Ratings / reviews summary
 */
export const getReviewSummary = async (hotelId, { fromDate, toDate }) => {
  const match = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    isPublished: true,
  };
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  const summary = await Review.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgOverall: { $avg: "$ratings.overall" },
        avgCleanliness: { $avg: "$ratings.cleanliness" },
        avgComfort: { $avg: "$ratings.comfort" },
        avgLocation: { $avg: "$ratings.location" },
        avgFacilities: { $avg: "$ratings.facilities" },
        avgStaff: { $avg: "$ratings.staff" },
        avgValue: { $avg: "$ratings.valueForMoney" },
        count: { $sum: 1 },
      },
    },
  ]);

  return summary[0] || {};
};

/**
 * Full dashboard snapshot for a hotel
 */
export const getDashboardSnapshot = async (hotelId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayRevenue, monthRevenue, occupancy, pendingTasks] =
    await Promise.all([
      Payment.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            status: "completed",
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            status: "completed",
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      getOccupancyReport(hotelId, { fromDate: today, toDate: today }),
      Booking.countDocuments({
        hotelId,
        status: { $in: ["pending", "confirmed"] },
      }),
    ]);

  return {
    todayRevenue: todayRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    occupancyRate: occupancy.report[0]?.occupancyRate || 0,
    pendingBookings: pendingTasks,
  };
};
