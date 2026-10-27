import express from "express";
import {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  assignTask,
  completeTask,
  getMyTasks,
} from "../../controllers/housekeepingController.js";
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
  getAllTasks,
);
router.get(
  "/my-tasks",
  authenticate,
  authorize("housekeeping", "manager", "hotel_admin"),
  getMyTasks,
);
router.post(
  "/",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createTask,
);
router.get("/:id", authenticate, getTask);
router.patch(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  updateTask,
);
router.post(
  "/:id/assign",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  assignTask,
);
router.post(
  "/:id/complete",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager", "housekeeping"),
  completeTask,
);

export default router;
