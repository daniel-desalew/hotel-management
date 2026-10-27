import cron from "node-cron";
import dayjs from "dayjs";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Housekeeping from "../models/Housekeeping.js";
import Booking from "../models/Booking.js";
import { emitToUser, emitToHotel, EVENTS } from "../config/socket.js";
import logger from "../utils/logger.js";

/**
 * Auto-create housekeeping tasks for dirty rooms
 */
export const createCheckoutCleaningTasks = async () => {
  try {
    const dirtyRooms = await Room.find({
      housekeepingStatus: "dirty",
      isActive: true,
    }).populate("hotelId", "name");

    if (!dirtyRooms.length) return;

    for (const room of dirtyRooms) {
      // Check if a task already exists
      const existing = await Housekeeping.findOne({
        roomId: room._id,
        status: { $in: ["pending", "in_progress"] },
        taskType: "checkout_cleaning",
      });
      if (existing) continue;

      await Housekeeping.create({
        hotelId: room.hotelId._id || room.hotelId,
        roomId: room._id,
        taskType: "checkout_cleaning",
        priority: "high",
        status: "pending",
        scheduledAt: new Date(),
      });

      logger.info(`🧹 Created cleaning task for room ${room.roomNumber}`);
    }
  } catch (error) {
    logger.error(`Auto-create cleaning task failed: ${error.message}`);
  }
};

/**
 * Assign pending tasks to staff using round-robin
 */
export const autoAssignPendingTasks = async () => {
  try {
    const pendingTasks = await Housekeeping.find({
      status: "pending",
      assignedTo: null,
    });
    if (!pendingTasks.length) return;

    // Group tasks by hotel
    const tasksByHotel = {};
    for (const task of pendingTasks) {
      const key = task.hotelId.toString();
      if (!tasksByHotel[key]) tasksByHotel[key] = [];
      tasksByHotel[key].push(task);
    }

    for (const [hotelId, tasks] of Object.entries(tasksByHotel)) {
      // Get housekeepers for this hotel, sorted by current load
      const housekeepers = await User.find({
        role: "housekeeping",
        hotelId,
        isActive: true,
      });

      if (!housekeepers.length) {
        logger.warn(`No housekeeping staff available for hotel ${hotelId}`);
        continue;
      }

      // Get current task count per housekeeper
      const counts = await Promise.all(
        housekeepers.map(async (hk) => {
          const count = await Housekeeping.countDocuments({
            assignedTo: hk._id,
            status: { $in: ["pending", "in_progress"] },
          });
          return { user: hk, count };
        }),
      );
      counts.sort((a, b) => a.count - b.count);

      // Assign tasks
      for (let i = 0; i < tasks.length; i++) {
        const assignee = counts[i % counts.length].user;
        tasks[i].assignedTo = assignee._id;
        tasks[i].status = "in_progress";
        tasks[i].startedAt = new Date();
        await tasks[i].save();

        emitToUser(assignee._id, EVENTS.HOUSEKEEPING_ASSIGNED, tasks[i]);
        logger.info(
          `🧹 Assigned task ${tasks[i]._id} to ${assignee.firstName}`,
        );
      }
    }
  } catch (error) {
    logger.error(`Auto-assign task failed: ${error.message}`);
  }
};

/**
 * Send daily briefing at 8 AM
 */
export const sendDailyBriefing = async () => {
  try {
    const hotels = await User.distinct("hotelId", {
      role: "hotel_admin",
      isActive: true,
    });

    for (const hotelId of hotels) {
      if (!hotelId) continue;

      const today = dayjs().startOf("day").toDate();
      const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

      const [arrivals, departures, pendingTasks] = await Promise.all([
        Booking.countDocuments({
          hotelId,
          checkIn: { $gte: today, $lt: tomorrow },
          status: { $in: ["confirmed", "pending"] },
        }),
        Booking.countDocuments({
          hotelId,
          checkOut: { $gte: today, $lt: tomorrow },
          status: "checked_in",
        }),
        Housekeeping.countDocuments({
          hotelId,
          status: { $in: ["pending", "in_progress"] },
        }),
      ]);

      emitToHotel(hotelId, EVENTS.DASHBOARD_REFRESH, {
        type: "daily_briefing",
        data: { arrivals, departures, pendingTasks },
      });

      logger.info(
        `📊 Briefing for hotel ${hotelId}: ${arrivals} arrivals, ${departures} departures`,
      );
    }
  } catch (error) {
    logger.error(`Daily briefing failed: ${error.message}`);
  }
};

/**
 * Start scheduler
 */
export const startHousekeepingSchedulerJob = () => {
  // Every 30 minutes — create cleaning tasks
  cron.schedule("*/30 * * * *", createCheckoutCleaningTasks, {
    timezone: "UTC",
  });

  // Every 15 minutes — auto-assign pending tasks
  cron.schedule("*/15 * * * *", autoAssignPendingTasks, { timezone: "UTC" });

  // Every day at 8:00 AM — daily briefing
  cron.schedule("0 8 * * *", sendDailyBriefing, { timezone: "UTC" });

  logger.info("⏰ Housekeeping scheduler jobs scheduled");
};

export default startHousekeepingSchedulerJob;
