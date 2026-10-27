import express from "express";
import {
  createGuestCommunication,
  getGuestCommunications,
} from "../../controllers/guestCommunicationController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  getGuestCommunications,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createGuestCommunication,
);

export default router;
