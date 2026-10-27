import express from "express";
import {
  createRoomType,
  getRoomTypes,
  updateRoomType,
  createRoom,
  getAllRooms,
  getRoom,
  updateRoom,
  changeRoomStatus,
  deleteRoom,
} from "../../controllers/roomController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

// ─── Room Types ────────────────────────────────────────────────
router.get("/types", getRoomTypes);
router.post(
  "/types",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  createRoomType,
);
router.patch(
  "/types/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  updateRoomType,
);

// ─── Rooms ─────────────────────────────────────────────────────
router.get("/", getAllRooms);
router.get("/:id", getRoom);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  createRoom,
);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  updateRoom,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize(
    "super_admin",
    "hotel_admin",
    "manager",
    "receptionist",
    "housekeeping",
  ),
  changeRoomStatus,
);
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin"),
  deleteRoom,
);

export default router;
