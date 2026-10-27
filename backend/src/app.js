import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes/index.js";
import errorHandler, { notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/audit.js";
import logger from "./utils/logger.js";

const app = express();
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://[::1]:3000",
  "http://[::1]:5173",
  "http://[::1]:5174",
  "http://[::1]:5175",
];
const allowedOrigins = Array.from(
  new Set(
    [
      ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
      ...defaultOrigins,
    ]
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
    return isLocal && ["http:", "https:"].includes(protocol);
  } catch {
    return false;
  }
};

// ─── Trust proxy (for accurate IP behind load balancers) ───────
app.set("trust proxy", 1);

// ─── Security ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// ─── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request logging ───────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev", { stream: logger.stream }));
}
app.use(requestLogger);

// ─── Static files ──────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Rate limiting on all API routes ───────────────────────────
app.use("/api", apiLimiter);

// ─── Health & root ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "🏨 Hotel Management API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.json({
    name: "Hotel Management System",
    version: "1.0.0",
    docs: "/api/v1",
    health: "/health",
  });
});

// ─── API Routes ────────────────────────────────────────────────
app.use("/api/v1", routes);

// ─── 404 Handler ───────────────────────────────────────────────
app.use(notFound);

// ─── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
