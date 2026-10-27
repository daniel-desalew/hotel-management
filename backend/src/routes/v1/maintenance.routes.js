import express from "express";
import {
  createRequest,
  getAllRequests,
  getRequest,
  updateRequest,
  assignRequest,
  resolveRequest,
} from "../../controllers/maintenanceController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(
    "super_admin",
    "hotel_admin",
    "manager",
    "receptionist",
    "housekeeping",
  ),
  getAllRequests,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createRequest,
);
router.get("/:id", authenticate, getRequest);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  updateRequest,
);
router.post(
  "/:id/assign",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  assignRequest,
);
router.post(
  "/:id/resolve",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  resolveRequest,
);

export default router;
