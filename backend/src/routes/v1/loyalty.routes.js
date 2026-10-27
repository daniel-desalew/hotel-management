import express from "express";
import {
  createLoyaltyMember,
  getLoyaltyMembers,
  updateLoyaltyMember,
  deleteLoyaltyMember,
  createLoyaltyRedemption,
  getLoyaltyRedemptions,
} from "../../controllers/loyaltyController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  getLoyaltyMembers,
);
router.post(
  "/",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createLoyaltyMember,
);
router.get(
  "/redemptions",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  getLoyaltyRedemptions,
);
router.post(
  "/redemptions",
  authorize("super_admin", "hotel_admin", "manager", "receptionist"),
  createLoyaltyRedemption,
);
router.patch(
  "/:id",
  authorize("super_admin", "hotel_admin", "manager"),
  updateLoyaltyMember,
);
router.delete(
  "/:id",
  authorize("super_admin", "hotel_admin"),
  deleteLoyaltyMember,
);

export default router;
