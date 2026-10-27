// backend/src/routes/v1/invoice.routes.js
import express from "express";
import {
  getAllInvoices,
  generateFromBooking,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
} from "../../controllers/invoiceController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// ─── Generate from booking (must come BEFORE /:id routes) ──
router.post(
  "/generate/:bookingId",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  generateFromBooking,
);

// ─── CRUD ──────────────────────────────────────────────────
router.get("/", getAllInvoices);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager"),
  createInvoice,
);
router.get("/:id", getInvoice);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updateInvoice,
);
router.delete("/:id", authorize("super_admin", "hotel_admin"), deleteInvoice);

// ─── Actions ───────────────────────────────────────────────
router.post(
  "/:id/send",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  sendInvoiceEmail,
);

export default router;
