import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * Authenticate a request via JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Authentication required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -refreshTokens",
    );

    if (!user || !user.isActive)
      throw new ApiError(401, "Invalid or inactive user");

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    next(error);
  }
};

/**
 * Optional authentication — attaches user if token exists, else continues
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -refreshTokens",
    );
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // Ignore errors — user is optional
  }
  next();
};

/**
 * Role-based access check
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    next();
  };

/**
 * Ensure user belongs to the specified hotel (multi-tenancy guard)
 */
export const checkHotelAccess = (getHotelId) => async (req, res, next) => {
  try {
    if (req.user.role === "super_admin") return next();

    const hotelId =
      typeof getHotelId === "function" ? getHotelId(req) : req.params.hotelId;
    if (!hotelId) return next();

    if (req.user.hotelId?.toString() !== hotelId.toString()) {
      return next(new ApiError(403, "Access denied to this hotel"));
    }
    next();
  } catch (err) {
    next(err);
  }
};
