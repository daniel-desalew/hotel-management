import dotenv from "dotenv";
dotenv.config();

// ─── Register all models (Mongoose needs them loaded) ─────
import "./models/User.js";
import "./models/Hotel.js";
import "./models/Amenity.js";
import "./models/RoomType.js";
import "./models/Room.js";
import "./models/Guest.js";
import "./models/Booking.js";
import "./models/Payment.js";
import "./models/Staff.js";
import "./models/Housekeeping.js";
import "./models/Review.js";
import "./models/Invoice.js";
import "./models/Notification.js";
import "./models/AuditLog.js";
// ─── App + config ──────────────────────────────────────────
import http from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import connectRedis from "./config/redis.js";
import initSocket from "./config/socket.js";
import logger from "./utils/logger.js";

// ─── Cron jobs ─────────────────────────────────────────────────
import startBookingReminderJob from "./jobs/bookingReminder.js";
import startHousekeepingSchedulerJob from "./jobs/housekeepingScheduler.js";
import startNightlyAuditJob from "./jobs/nightlyAudit.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Database
    await connectDB();

    // 2. Redis (optional)
    connectRedis();

    // 3. HTTP + Socket.io
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // 4. Start cron jobs
    startBookingReminderJob();
    startHousekeepingSchedulerJob();
    startNightlyAuditJob();

    // 5. Listen
    httpServer.listen(PORT, () => {
      const banner = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏨  HOTEL MANAGEMENT SYSTEM — BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀  Server:        http://localhost:${PORT}
🌍  Environment:   ${process.env.NODE_ENV || "development"}
🔌  Socket.io:     ready
📡  API base:      http://localhost:${PORT}/api/v1
❤️   Health check:  http://localhost:${PORT}/health
⏰  Cron jobs:     3 schedulers active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      console.log(banner);
      logger.info(`Server started on port ${PORT}`);
    });

    // ─── Graceful shutdown ──────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      httpServer.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force exit if not closed in 10s
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // ─── Unhandled rejections ───────────────────────────────────
    process.on("unhandledRejection", (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on("uncaughtException", (err) => {
      logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

startServer();
