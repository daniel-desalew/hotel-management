import express from "express";
import {
  createPayroll,
  getPayrollRecords,
  updatePayroll,
  deletePayroll,
} from "../../controllers/payrollController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "front_desk"),
  getPayrollRecords,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager"),
  createPayroll,
);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updatePayroll,
);
router.delete("/:id", authorize("super_admin", "hotel_admin"), deletePayroll);

export default router;
