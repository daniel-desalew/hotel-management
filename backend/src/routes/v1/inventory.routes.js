import express from "express";
import {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
} from "../../controllers/inventoryController.js";
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
  getAllInventoryItems,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  createInventoryItem,
);
router.get("/:id", authenticate, getInventoryItem);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  updateInventoryItem,
);
router.post(
  "/:id/adjust",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  adjustInventoryStock,
);

export default router;
