import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Room from "../models/Room.js";

let io = null;

// ─── Room naming conventions ────────────────────────────────────
// hotel:<hotelId>   → all staff of a hotel
// user:<userId>     → a specific user
// role:<roleName>   → all users with that role
export const ROOMS = {
  hotel: (hotelId) => `hotel:${hotelId}`,
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
};

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5175"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "-password -refreshTokens",
      );

      if (!user || !user.isActive) {
        return next(new Error("Authentication failed"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  // ─── Connection handler ───────────────────────────────────────
  io.on("connection", (socket) => {
    const userName = socket.user
      ? `${socket.user.firstName} ${socket.user.lastName}`
      : "Anonymous";
    console.log(`🔌 Socket connected: ${socket.id} (${userName})`);

    if (socket.user) {
      socket.join(ROOMS.user(socket.user._id.toString()));
      socket.join(ROOMS.role(socket.user.role));
      if (socket.user.hotelId) {
        socket.join(ROOMS.hotel(socket.user.hotelId.toString()));
      }
    }

    socket.on("join:hotel", (hotelId) => {
      const ownHotelId = socket.user.hotelId?.toString();
      if (socket.user.role !== "super_admin" && ownHotelId !== hotelId?.toString()) return;
      socket.join(ROOMS.hotel(hotelId));
      console.log(`   ↳ ${userName} joined hotel:${hotelId}`);
    });

    socket.on("leave:hotel", (hotelId) => {
      socket.leave(ROOMS.hotel(hotelId));
    });

    socket.on("join:room", async (roomId) => {
      try {
        const room = await Room.findById(roomId).select("hotelId");
        const ownHotelId = socket.user.hotelId?.toString();
        if (room && (socket.user.role === "super_admin" || ownHotelId === room.hotelId?.toString())) {
          socket.join(`room:${roomId}`);
        }
      } catch {
        // Ignore invalid room subscription requests.
      }
    });

    socket.on("leave:room", (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on("ping:server", (cb) => {
      if (typeof cb === "function") cb({ ok: true, ts: Date.now() });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

// ─── Broadcast helpers ──────────────────────────────────────────
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitToHotel = (hotelId, event, payload) => {
  if (!io) return;
  io.to(ROOMS.hotel(hotelId.toString())).emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(ROOMS.user(userId.toString())).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  if (!io) return;
  io.to(ROOMS.role(role)).emit(event, payload);
};

export const emitToAll = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

// ─── Common event names ─────────────────────────────────────────
export const EVENTS = {
  BOOKING_CREATED: "booking:created",
  BOOKING_UPDATED: "booking:updated",
  BOOKING_CANCELLED: "booking:cancelled",
  CHECK_IN: "booking:check-in",
  CHECK_OUT: "booking:check-out",
  ROOM_STATUS_CHANGED: "room:status-changed",
  ROOM_CLEANED: "room:cleaned",
  PAYMENT_RECEIVED: "payment:received",
  PAYMENT_FAILED: "payment:failed",
  HOUSEKEEPING_ASSIGNED: "housekeeping:assigned",
  HOUSEKEEPING_COMPLETED: "housekeeping:completed",
  MAINTENANCE_CREATED: "maintenance:created",
  NOTIFICATION_NEW: "notification:new",
  DASHBOARD_REFRESH: "dashboard:refresh",
};

export default initSocket;
