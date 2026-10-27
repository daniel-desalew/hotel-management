import express from "express";
import {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequest,
  updateServiceRequest,
  assignServiceRequest,
  completeServiceRequest,
} from "../../controllers/serviceRequestController.js";
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
  getAllServiceRequests,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createServiceRequest,
);
router.get("/:id", authenticate, getServiceRequest);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  updateServiceRequest,
);
router.post(
  "/:id/assign",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  assignServiceRequest,
);
router.post(
  "/:id/complete",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  completeServiceRequest,
);

export default router;
