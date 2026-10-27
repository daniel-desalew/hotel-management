import cron from "node-cron";
import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Payment from "../models/Payment.js";
import Hotel from "../models/Hotel.js";
import AuditLog from "../models/AuditLog.js";
import { emitToHotel, EVENTS } from "../config/socket.js";
import logger from "../utils/logger.js";

/**
 * Roll over the business date — mark bookings that should be no-show, close the day, etc.
 */
export const runNightAudit = async () => {
  const startTime = Date.now();
  logger.info("🌙 Starting nightly audit...");

  try {
    const hotels = await Hotel.find({ isActive: true });

    for (const hotel of hotels) {
      const hotelId = hotel._id;
      const today = dayjs().startOf("day").toDate();

      // ─── 1. Mark overdue check-ins as no-show ────────────────
      const noShowResult = await Booking.updateMany(
        {
          hotelId,
          checkIn: { $lt: today },
          status: { $in: ["pending", "confirmed"] },
        },
        {
          $set: {
            status: "no_show",
            "cancellation.reason": "Auto-marked by night audit",
            "cancellation.cancelledAt": new Date(),
          },
        },
      );

      // ─── 2. Compute day statistics ───────────────────────────
      const stats = await Booking.aggregate([
        {
          $match: {
            hotelId,
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            revenue: { $sum: "$pricing.totalAmount" },
            nights: { $sum: "$nights" },
          },
        },
      ]);

      const dayStats = stats[0] || { bookings: 0, revenue: 0, nights: 0 };

      // ─── 3. Compute occupancy ────────────────────────────────
      const totalRooms = await Room.countDocuments({ hotelId, isActive: true });
      const occupiedRooms = await Room.countDocuments({
        hotelId,
        status: "occupied",
      });
      const occupancyRate = totalRooms
        ? Math.round((occupiedRooms / totalRooms) * 10000) / 100
        : 0;

      // ─── 4. Write audit log ──────────────────────────────────
      await AuditLog.create({
        hotelId,
        action: "other",
        entity: "System",
        description: `Nightly audit run for ${dayjs().format("YYYY-MM-DD")}`,
        changes: {
          noShows: noShowResult.modifiedCount,
          bookings: dayStats.bookings,
          revenue: dayStats.revenue,
          occupancyRate,
          totalRooms,
          occupiedRooms,
        },
      });

      // ─── 5. Notify hotel admins ──────────────────────────────
      emitToHotel(hotelId, EVENTS.DASHBOARD_REFRESH, {
        type: "night_audit",
        data: {
          date: dayjs().format("YYYY-MM-DD"),
          noShows: noShowResult.modifiedCount,
          ...dayStats,
          occupancyRate,
        },
      });

      logger.info(
        `🌙 Audit for ${hotel.name}: ${noShowResult.modifiedCount} no-shows, $${dayStats.revenue} revenue, ${occupancyRate}% occupancy`,
      );
    }

    const duration = Date.now() - startTime;
    logger.info(`✅ Nightly audit completed in ${duration}ms`);
  } catch (error) {
    logger.error(`Nightly audit failed: ${error.message}`);
  }
};

/**
 * Reset room housekeeping status for a new day
 */
export const resetHousekeepingForNewDay = async () => {
  try {
    const result = await Room.updateMany(
      { housekeepingStatus: "inspected" },
      { $set: { housekeepingStatus: "clean" } },
    );
    logger.info(`♻️ Reset ${result.modifiedCount} rooms to 'clean'`);
  } catch (error) {
    logger.error(`Reset housekeeping failed: ${error.message}`);
  }
};

/**
 * Clean up expired sessions/tokens older than 30 days
 */
export const cleanupExpiredTokens = async () => {
  try {
    const cutoff = dayjs().subtract(30, "day").toDate();
    const User = (await import("../models/User.js")).default;

    const result = await User.updateMany(
      {},
      {
        $pull: { refreshTokens: { createdAt: { $lt: cutoff } } },
      },
    );
    logger.info(`🧹 Cleaned up tokens for ${result.modifiedCount} users`);
  } catch (error) {
    logger.error(`Token cleanup failed: ${error.message}`);
  }
};

/**
 * Start scheduler
 */
export const startNightlyAuditJob = () => {
  // Every day at 2:00 AM — run night audit
  cron.schedule("0 2 * * *", runNightAudit, { timezone: "UTC" });

  // Every day at 3:00 AM — reset housekeeping
  cron.schedule("0 3 * * *", resetHousekeepingForNewDay, { timezone: "UTC" });

  // Every day at 4:00 AM — clean up tokens
  cron.schedule("0 4 * * *", cleanupExpiredTokens, { timezone: "UTC" });

  logger.info("⏰ Nightly audit jobs scheduled");
};

export default startNightlyAuditJob;
