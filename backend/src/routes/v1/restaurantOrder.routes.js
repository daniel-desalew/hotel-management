import express from "express";
import {
  createRestaurantOrder,
  getRestaurantOrders,
  updateRestaurantOrder,
  deleteRestaurantOrder,
} from "../../controllers/restaurantOrderController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "front_desk"),
  getRestaurantOrders,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "front_desk"),
  createRestaurantOrder,
);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updateRestaurantOrder,
);
router.delete(
  "/:id",
  authorize("super_admin", "hotel_admin"),
  deleteRestaurantOrder,
);

export default router;
