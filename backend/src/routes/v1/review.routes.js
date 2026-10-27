import express from "express";
import {
  createReview,
  getAllReviews,
  getReview,
  respondToReview,
  deleteReview,
} from "../../controllers/reviewController.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", getAllReviews);
router.get("/:id", getReview);
router.post("/", authenticate, createReview);
router.post(
  "/:id/respond",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  respondToReview,
);
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "hotel_admin", "manager"),
  deleteReview,
);

export default router;
