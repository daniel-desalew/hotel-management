import cron from "node-cron";
import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import { sendEmail } from "../services/emailService.js";
import { emitToHotel, EVENTS } from "../config/socket.js";
import logger from "../utils/logger.js";

/**
 * Send check-in reminders for tomorrow's arrivals
 */
export const sendCheckInReminders = async () => {
  try {
    const tomorrow = dayjs().add(1, "day").startOf("day").toDate();
    const dayAfter = dayjs().add(2, "day").startOf("day").toDate();

    const bookings = await Booking.find({
      checkIn: { $gte: tomorrow, $lt: dayAfter },
      status: { $in: ["confirmed", "pending"] },
    })
      .populate("guestId", "firstName lastName email")
      .populate("hotelId", "name address contact");

    for (const booking of bookings) {
      if (!booking.guestId?.email) continue;
      try {
        await sendEmail({
          to: booking.guestId.email,
          subject: `Reminder: Check-in tomorrow at ${booking.hotelId?.name}`,
          html: `
            <h2>Hi ${booking.guestId.firstName},</h2>
            <p>This is a friendly reminder of your upcoming stay.</p>
            <p><strong>Booking #:</strong> ${booking.bookingNumber}</p>
            <p><strong>Check-in:</strong> ${dayjs(booking.checkIn).format("dddd, MMMM D, YYYY")}</p>
            <p><strong>Hotel:</strong> ${booking.hotelId?.name}</p>
            <p>See you soon!</p>
          `,
        });
        logger.info(
          `📧 Check-in reminder sent for booking ${booking.bookingNumber}`,
        );
      } catch (err) {
        logger.error(
          `Failed to send reminder for ${booking.bookingNumber}: ${err.message}`,
        );
      }
    }

    logger.info(`✅ Check-in reminders sent: ${bookings.length}`);
  } catch (error) {
    logger.error(`Check-in reminder job failed: ${error.message}`);
  }
};

/**
 * Send thank-you / review request emails after check-out
 */
export const sendCheckOutFollowUps = async () => {
  try {
    const yesterday = dayjs().subtract(1, "day").startOf("day").toDate();
    const today = dayjs().startOf("day").toDate();

    const bookings = await Booking.find({
      actualCheckOut: { $gte: yesterday, $lt: today },
      status: "checked_out",
    })
      .populate("guestId", "firstName lastName email")
      .populate("hotelId", "name");

    for (const booking of bookings) {
      if (!booking.guestId?.email) continue;
      try {
        await sendEmail({
          to: booking.guestId.email,
          subject: `Thanks for staying at ${booking.hotelId?.name}!`,
          html: `
            <h2>Thank you, ${booking.guestId.firstName}!</h2>
            <p>We hope you enjoyed your stay with us.</p>
            <p>Would you mind taking a moment to share your experience?</p>
            <p>Booking #${booking.bookingNumber}</p>
          `,
        });
      } catch (err) {
        logger.error(`Follow-up email failed: ${err.message}`);
      }
    }

    logger.info(`✅ Check-out follow-ups sent: ${bookings.length}`);
  } catch (error) {
    logger.error(`Check-out follow-up job failed: ${error.message}`);
  }
};

/**
 * Mark no-show bookings (didn't check in within 24h)
 */
export const markNoShows = async () => {
  try {
    const cutoff = dayjs().subtract(24, "hour").toDate();

    const result = await Booking.updateMany(
      {
        checkIn: { $lt: cutoff },
        status: { $in: ["confirmed", "pending"] },
      },
      {
        $set: {
          status: "no_show",
          "cancellation.reason": "Guest did not arrive within 24 hours",
          "cancellation.cancelledAt": new Date(),
        },
      },
    );

    if (result.modifiedCount > 0) {
      logger.warn(`⚠️ Marked ${result.modifiedCount} bookings as no-show`);
    }
  } catch (error) {
    logger.error(`No-show job failed: ${error.message}`);
  }
};

/**
 * Start the cron scheduler
 */
export const startBookingReminderJob = () => {
  // Every day at 9:00 AM — send check-in reminders
  cron.schedule("0 9 * * *", sendCheckInReminders, {
    timezone: "UTC",
  });

  // Every day at 11:00 AM — send follow-up emails
  cron.schedule("0 11 * * *", sendCheckOutFollowUps, {
    timezone: "UTC",
  });

  // Every hour — check for no-shows
  cron.schedule("0 * * * *", markNoShows, {
    timezone: "UTC",
  });

  logger.info("⏰ Booking reminder jobs scheduled");
};

export default startBookingReminderJob;
