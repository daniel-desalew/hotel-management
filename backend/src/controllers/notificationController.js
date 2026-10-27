// backend/src/controllers/notificationController.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToUser, EVENTS } from "../config/socket.js";

// ─────────────────────────────────────────────────────────────
// @desc   List my notifications
// @route  GET /api/v1/notifications
// @access Private
// ─────────────────────────────────────────────────────────────
export const getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (unreadOnly === "true") filter.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications,
          unreadCount,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Notifications fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Get unread count
// @route  GET /api/v1/notifications/unread-count
// @access Private
// ─────────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    res
      .status(200)
      .json(new ApiResponse(200, { count }, "Unread count fetched"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Mark notification as read
// @route  PATCH /api/v1/notifications/:id/read
// @access Private
// ─────────────────────────────────────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) throw new ApiError(404, "Notification not found");
    res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Mark all as read
// @route  PATCH /api/v1/notifications/read-all
// @access Private
// ─────────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { modifiedCount: result.modifiedCount },
          "All marked as read",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Delete notification
// @route  DELETE /api/v1/notifications/:id
// @access Private
// ─────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!notification) throw new ApiError(404, "Notification not found");
    res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Clear all notifications
// @route  DELETE /api/v1/notifications
// @access Private
// ─────────────────────────────────────────────────────────────
export const clearAll = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedCount: result.deletedCount },
          "All notifications cleared",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Create + send notification (used internally)
// This is called from other controllers
// ─────────────────────────────────────────────────────────────
export const sendNotification = async ({
  userId,
  hotelId = null,
  type,
  title,
  message,
  data = {},
  priority = "normal",
  actionUrl = null,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      hotelId,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
    });

    // Real-time push via Socket.io
    emitToUser(userId, EVENTS.NOTIFICATION_NEW, notification);

    return notification;
  } catch (error) {
    console.error("sendNotification error:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Broadcast to all hotel staff
// Helper used by other controllers
// ─────────────────────────────────────────────────────────────
export const sendNotificationToHotel = async ({
  hotelId,
  roles = ["hotel_admin", "manager", "receptionist"],
  type,
  title,
  message,
  data = {},
  priority = "normal",
}) => {
  try {
    const users = await User.find({
      hotelId,
      role: { $in: roles },
      isActive: true,
    }).select("_id");

    await Promise.all(
      users.map((u) =>
        sendNotification({
          userId: u._id,
          hotelId,
          type,
          title,
          message,
          data,
          priority,
        }),
      ),
    );
  } catch (error) {
    console.error("sendNotificationToHotel error:", error.message);
  }
};
