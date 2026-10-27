import express from "express";
import {
  getDashboardMetrics,
  getRevenueChart,
  getOccupancyChart,
  getTodayActivity,
} from "../../controllers/dashboardController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
);

router.get("/", getDashboardMetrics);
router.get("/revenue-chart", getRevenueChart);
router.get("/occupancy-chart", getOccupancyChart);
router.get("/today", getTodayActivity);

export default router;
