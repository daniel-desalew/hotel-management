import express from "express";
import {
  createAttendance,
  getAttendanceRecords,
  updateAttendance,
  deleteAttendance,
} from "../../controllers/attendanceController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "front_desk"),
  getAttendanceRecords,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager"),
  createAttendance,
);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updateAttendance,
);
router.delete(
  "/:id",
  authorize("super_admin", "hotel_admin"),
  deleteAttendance,
);

export default router;
