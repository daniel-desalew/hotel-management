// backend/src/routes/v1/user.routes.js
import express from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../../controllers/userController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager"),
  getAllUsers,
);
router.get("/:id", getUser);
router.patch("/:id", authorize("super_admin", "hotel_admin"), updateUser);
router.delete("/:id", authorize("super_admin"), deleteUser);

export default router;
