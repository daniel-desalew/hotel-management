import express from "express";
import {
  createStaff,
  getAllStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  getStaffByDepartment,
} from "../../controllers/staffController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  getAllStaff,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin"),
  createStaff,
);
router.get("/department/:dept", authenticate, getStaffByDepartment);
router.get("/:id", authenticate, getStaff);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  updateStaff,
);
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin"),
  deleteStaff,
);

export default router;
