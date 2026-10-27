import ApiError from "../utils/ApiError.js";

/**
 * 404 handler — must be registered AFTER all routes
 */
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // ─── Mongoose: duplicate key ────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    errors = [{ field, message }];
    statusCode = 400;
  }

  // ─── Mongoose: validation error ─────────────────────────────
  if (err.name === "ValidationError") {
    message = "Validation Error";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    statusCode = 400;
  }

  // ─── Mongoose: invalid ObjectId ─────────────────────────────
  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
    errors = [{ field: err.path, message }];
    statusCode = 400;
  }

  // ─── JWT errors ─────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // ─── Multer: file upload errors ─────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File too large";
    statusCode = 400;
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Unexpected file field";
    statusCode = 400;
  }

  // ─── Log error (skip for expected 4xx in production) ────────
  if (statusCode >= 500) {
    console.error("❌ Server Error:", err);
  }

  // ─── Response ───────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length ? errors : undefined,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      name: err.name,
    }),
  });
};

export default errorHandler;
