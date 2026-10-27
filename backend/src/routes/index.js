// backend/src/routes/index.js
import express from "express";

// ─── Route modules ──────────────────────────────────────────
import authRoutes from "./v1/auth.routes.js";
import userRoutes from "./v1/user.routes.js"; // ← NEW
import hotelRoutes from "./v1/hotel.routes.js";
import roomRoutes from "./v1/room.routes.js";
import bookingRoutes from "./v1/booking.routes.js";
import paymentRoutes from "./v1/payment.routes.js";
import guestRoutes from "./v1/guest.routes.js";
import staffRoutes from "./v1/staff.routes.js";
import housekeepingRoutes from "./v1/housekeeping.routes.js";
import reviewRoutes from "./v1/review.routes.js";
import reportRoutes from "./v1/report.routes.js";
import dashboardRoutes from "./v1/dashboard.routes.js";
import invoiceRoutes from "./v1/invoice.routes.js";
import maintenanceRoutes from "./v1/maintenance.routes.js";
import serviceRequestRoutes from "./v1/serviceRequest.routes.js";
import inventoryRoutes from "./v1/inventory.routes.js";
import attendanceRoutes from "./v1/attendance.routes.js";
import payrollRoutes from "./v1/payroll.routes.js";
import restaurantOrderRoutes from "./v1/restaurantOrder.routes.js";
import procurementRoutes from "./v1/procurement.routes.js";
import loyaltyRoutes from "./v1/loyalty.routes.js";
import guestCommunicationRoutes from "./v1/guestCommunication.routes.js";
import notificationRoutes from "./v1/notification.routes.js";

const router = express.Router();

// ─── Health check / route list ──────────────────────────────
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏨 Hotel Management API v1",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users", // ← NEW
      hotels: "/api/v1/hotels",
      rooms: "/api/v1/rooms",
      bookings: "/api/v1/bookings",
      payments: "/api/v1/payments",
      guests: "/api/v1/guests",
      staff: "/api/v1/staff",
      housekeeping: "/api/v1/housekeeping",
      maintenance: "/api/v1/maintenance",
      "service-requests": "/api/v1/service-requests",
      inventory: "/api/v1/inventory",
      attendance: "/api/v1/attendance",
      payroll: "/api/v1/payroll",
      "restaurant-orders": "/api/v1/restaurant-orders",
      procurement: "/api/v1/procurement",
      loyalty: "/api/v1/loyalty",
      notifications: "/api/v1/notifications",
      "guest-communications": "/api/v1/guest-communications",
      reviews: "/api/v1/reviews",
      reports: "/api/v1/reports",
      dashboard: "/api/v1/dashboard",
      invoices: "/api/v1/invoices",
    },
  });
});

// ─── Mount all route modules ────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes); // ← NEW
router.use("/hotels", hotelRoutes);
router.use("/rooms", roomRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/guests", guestRoutes);
router.use("/staff", staffRoutes);
router.use("/housekeeping", housekeepingRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/service-requests", serviceRequestRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/payroll", payrollRoutes);
router.use("/restaurant-orders", restaurantOrderRoutes);
router.use("/procurement", procurementRoutes);
router.use("/loyalty", loyaltyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/guest-communications", guestCommunicationRoutes);
router.use("/reviews", reviewRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/invoices", invoiceRoutes);

export default router;
