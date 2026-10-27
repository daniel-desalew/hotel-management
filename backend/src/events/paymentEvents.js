import { emitToHotel, emitToUser, EVENTS } from "../config/socket.js";
import { sendPaymentReceipt } from "../services/emailService.js";
import { deleteCachePattern } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Called after a successful payment
 */
export const onPaymentReceived = async (payment) => {
  try {
    // 1. Cache invalidation
    await deleteCachePattern(`payments:${payment.hotelId}:*`);
    await deleteCachePattern(`dashboard:${payment.hotelId}:*`);

    // 2. Real-time notification
    emitToHotel(payment.hotelId, EVENTS.PAYMENT_RECEIVED, payment);
    emitToHotel(payment.hotelId, EVENTS.DASHBOARD_REFRESH, {
      type: "payment_received",
    });

    // 3. Send receipt to guest
    if (payment.bookingId?.guestId?.email) {
      await sendPaymentReceipt(payment, payment.bookingId).catch((err) =>
        logger.error(`Receipt email failed: ${err.message}`),
      );
    }

    logger.info(
      `💰 Payment received: ${payment.paymentNumber} ($${payment.amount})`,
    );
  } catch (error) {
    logger.error(`onPaymentReceived failed: ${error.message}`);
  }
};

/**
 * Called after a failed payment
 */
export const onPaymentFailed = async (payment, reason = "Unknown") => {
  try {
    emitToHotel(payment.hotelId, EVENTS.PAYMENT_FAILED, { payment, reason });
    logger.warn(`⚠️ Payment failed: ${payment.paymentNumber} — ${reason}`);
  } catch (error) {
    logger.error(`onPaymentFailed failed: ${error.message}`);
  }
};

/**
 * Called after a refund
 */
export const onRefund = async (payment) => {
  try {
    await deleteCachePattern(`payments:${payment.hotelId}:*`);
    emitToHotel(payment.hotelId, EVENTS.PAYMENT_RECEIVED, {
      type: "refund",
      payment,
    });
    logger.info(
      `💸 Refund processed: ${payment.paymentNumber} ($${payment.refund?.amount})`,
    );
  } catch (error) {
    logger.error(`onRefund failed: ${error.message}`);
  }
};

/**
 * Called when a new housekeeping task is assigned
 */
export const onHousekeepingAssigned = async (task, assigneeId) => {
  try {
    emitToUser(assigneeId, EVENTS.HOUSEKEEPING_ASSIGNED, task);
    logger.info(`🧹 Housekeeping task assigned: ${task._id}`);
  } catch (error) {
    logger.error(`onHousekeepingAssigned failed: ${error.message}`);
  }
};

/**
 * Called when a housekeeping task is completed
 */
export const onHousekeepingCompleted = async (task) => {
  try {
    emitToHotel(task.hotelId, EVENTS.HOUSEKEEPING_COMPLETED, task);
    emitToHotel(task.hotelId, EVENTS.ROOM_CLEANED, { roomId: task.roomId });
    logger.info(`✅ Housekeeping completed: ${task._id}`);
  } catch (error) {
    logger.error(`onHousekeepingCompleted failed: ${error.message}`);
  }
};
