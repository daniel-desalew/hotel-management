import express from "express";
import {
  createGuest,
  getAllGuests,
  getGuest,
  updateGuest,
  deleteGuest,
  getGuestProfile,
  addLoyaltyPoints,
} from "../../controllers/guestController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  getAllGuests,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createGuest,
);
router.get("/:id", authenticate, getGuest);
router.get("/:id/profile", authenticate, getGuestProfile);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  updateGuest,
);
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin"),
  deleteGuest,
);
router.post(
  "/:id/loyalty",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  addLoyaltyPoints,
);

export default router;
