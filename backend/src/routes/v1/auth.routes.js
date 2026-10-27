import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
  refreshToken,
} from "../../controllers/authController.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Private
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateProfile);
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, changePassword);

export default router;
