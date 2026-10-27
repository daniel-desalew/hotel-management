import express from "express";
import {
  checkAvailability,
  createBooking,
  getAllBookings,
  getBooking,
  updateBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getGuestBookings,
} from "../../controllers/bookingController.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validation.js";
import {
  checkAvailabilityValidator,
  createBookingValidator,
  updateBookingValidator,
  checkInValidator,
  cancelBookingValidator,
} from "../../validators/bookingValidator.js";

const router = express.Router();

// Public — allow guests to check availability
router.post(
  "/check-availability",
  validate(checkAvailabilityValidator),
  checkAvailability,
);

// Guest-specific
router.get("/guest/:guestId", authenticate, getGuestBookings);

// Private
router.get("/", authenticate, getAllBookings);
router.get("/:id", authenticate, getBooking);
router.post("/", authenticate, validate(createBookingValidator), createBooking);
router.patch(
  "/:id",
  authenticate,
  validate(updateBookingValidator),
  updateBooking,
);

// Lifecycle
router.post(
  "/:id/check-in",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  validate(checkInValidator),
  checkIn,
);
router.post(
  "/:id/check-out",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  checkOut,
);
router.post(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingValidator),
  cancelBooking,
);

export default router;
