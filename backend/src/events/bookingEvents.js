import { emitToHotel, emitToRole, EVENTS } from "../config/socket.js";
import {
  sendBookingConfirmation,
  sendBookingCancellation,
} from "../services/emailService.js";
import { deleteCachePattern } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Called after a new booking is created
 */
export const onBookingCreated = async (booking) => {
  try {
    // 1. Invalidate caches
    await deleteCachePattern(`bookings:${booking.hotelId}:*`);
    await deleteCachePattern(`dashboard:${booking.hotelId}:*`);

    // 2. Notify receptionists + managers in real-time
    emitToHotel(booking.hotelId, EVENTS.BOOKING_CREATED, booking);
    emitToRole("receptionist", EVENTS.BOOKING_CREATED, booking);

    // 3. Send confirmation email to guest
    if (booking.guestId?.email) {
      await sendBookingConfirmation(booking).catch((err) =>
        logger.error(
          `Email failed for booking ${booking.bookingNumber}: ${err.message}`,
        ),
      );
    }

    logger.info(`📢 Booking created event handled: ${booking.bookingNumber}`);
  } catch (error) {
    logger.error(`onBookingCreated failed: ${error.message}`);
  }
};

/**
 * Called after a booking is updated
 */
export const onBookingUpdated = async (booking) => {
  try {
    await deleteCachePattern(`booking:${booking._id}`);
    await deleteCachePattern(`bookings:${booking.hotelId}:*`);
    emitToHotel(booking.hotelId, EVENTS.BOOKING_UPDATED, booking);
    logger.info(`📢 Booking updated: ${booking.bookingNumber}`);
  } catch (error) {
    logger.error(`onBookingUpdated failed: ${error.message}`);
  }
};

/**
 * Called after a booking is cancelled
 */
export const onBookingCancelled = async (booking) => {
  try {
    await deleteCachePattern(`bookings:${booking.hotelId}:*`);
    emitToHotel(booking.hotelId, EVENTS.BOOKING_CANCELLED, booking);

    if (booking.guestId?.email) {
      await sendBookingCancellation(booking).catch((err) =>
        logger.error(`Cancellation email failed: ${err.message}`),
      );
    }

    logger.info(`📢 Booking cancelled: ${booking.bookingNumber}`);
  } catch (error) {
    logger.error(`onBookingCancelled failed: ${error.message}`);
  }
};

/**
 * Called when a guest checks in
 */
export const onCheckIn = async (booking) => {
  try {
    emitToHotel(booking.hotelId, EVENTS.CHECK_IN, booking);
    emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, {
      type: "check_in",
    });
    logger.info(`📢 Check-in: ${booking.bookingNumber}`);
  } catch (error) {
    logger.error(`onCheckIn failed: ${error.message}`);
  }
};

/**
 * Called when a guest checks out
 */
export const onCheckOut = async (booking) => {
  try {
    emitToHotel(booking.hotelId, EVENTS.CHECK_OUT, booking);
    emitToHotel(booking.hotelId, EVENTS.DASHBOARD_REFRESH, {
      type: "check_out",
    });
    logger.info(`📢 Check-out: ${booking.bookingNumber}`);
  } catch (error) {
    logger.error(`onCheckOut failed: ${error.message}`);
  }
};
