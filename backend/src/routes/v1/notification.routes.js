// backend/src/routes/v1/notification.routes.js
import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} from "../../controllers/notificationController.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/", clearAll);
router.delete("/:id", deleteNotification);

export default router;
