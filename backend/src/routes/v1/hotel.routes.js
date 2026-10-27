import express from "express";
import {
  createHotel,
  getAllHotels,
  getHotel,
  updateHotel,
  deleteHotel,
  getHotelStats,
} from "../../controllers/hotelController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

// Public read
router.get("/", getAllHotels);
router.get("/:id", getHotel);

// Private (admins only)
router.post("/", authenticate, authorize("super_admin"), createHotel);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin"),
  updateHotel,
);
router.delete("/:id", authenticate, authorize("super_admin"), deleteHotel);
router.get("/:id/stats", authenticate, getHotelStats);

export default router;
