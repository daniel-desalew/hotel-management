import express from "express";
import {
  getRevenueReport,
  getOccupancyReport,
  getGuestReport,
  getRoomTypeReport,
  getSourceReport,
} from "../../controllers/reportController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate, authorize("super_admin", "hotel_admin", "manager"));

router.get("/revenue", getRevenueReport);
router.get("/occupancy", getOccupancyReport);
router.get("/guests", getGuestReport);
router.get("/room-types", getRoomTypeReport);
router.get("/sources", getSourceReport);

export default router;
