import express from "express";
import {
  createPayment,
  getAllPayments,
  getPayment,
  refundPayment,
  getBookingPaymentSummary,
} from "../../controllers/paymentController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  getAllPayments,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createPayment,
);
router.get("/:id", authenticate, getPayment);
router.post(
  "/:id/refund",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  refundPayment,
);
router.get(
  "/booking/:bookingId/summary",
  authenticate,
  getBookingPaymentSummary,
);

export default router;
