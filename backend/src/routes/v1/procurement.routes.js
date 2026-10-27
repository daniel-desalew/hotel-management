import express from "express";
import {
  createProcurementOrder,
  getProcurementOrders,
  updateProcurementOrder,
  deleteProcurementOrder,
} from "../../controllers/procurementController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  getProcurementOrders,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager"),
  createProcurementOrder,
);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updateProcurementOrder,
);
router.delete(
  "/:id",
  authorize("super_admin", "hotel_admin"),
  deleteProcurementOrder,
);

export default router;
