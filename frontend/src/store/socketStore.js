// frontend/src/store/socketStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import { notificationApi } from "../api/notificationApi";

// ─── Event names (must match backend) ──────────────────────────
export const SOCKET_EVENTS = {
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

/**
 * Resolve the socket URL.
 * - In dev:      http://localhost:5000 (from .env or fallback)
 * - In Docker:   '/' means same origin (nginx proxies /socket.io to backend)
 */
const resolveSocketUrl = () => {
  const raw = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  // If it's just '/' or empty, use same-origin (undefined → io() uses window.location)
  if (!raw || raw === "/" || raw === "") return undefined;
  return raw;
};

const useSocketStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,

  // ─── Connect ──────────────────────────────────────────────
  connect: () => {
    const existing = get().socket;

    // Already connected — reuse
    if (existing && existing.connected) return existing;

    // Existing socket that's disconnected — reconnect
    if (existing && existing.disconnected) {
      existing.connect();
      set({ connecting: true, error: null });
      return existing;
    }

    const token = localStorage.getItem("accessToken");
    const socketUrl = resolveSocketUrl();

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
    });

    set({ socket, connecting: true, error: null });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      set({ connected: true, connecting: false, error: null });
      get().loadNotifications();
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      set({ connected: false });
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket error:", err.message);
      set({ connected: false, connecting: false, error: err.message });
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, (payload) => {
      get().pushNotification(payload);
    });

    return socket;
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({
        socket: null,
        connected: false,
        connecting: false,
        notifications: [],
        unreadCount: 0,
      });
    }
  },

  // ─── Room subscriptions ───────────────────────────────────
  joinHotel: (hotelId) => {
    const socket = get().socket;
    if (socket?.connected && hotelId) socket.emit("join:hotel", hotelId);
  },
  leaveHotel: (hotelId) => {
    const socket = get().socket;
    if (socket?.connected && hotelId) socket.emit("leave:hotel", hotelId);
  },
  joinRoom: (roomId) => {
    const socket = get().socket;
    if (socket?.connected && roomId) socket.emit("join:room", roomId);
  },
  leaveRoom: (roomId) => {
    const socket = get().socket;
    if (socket?.connected && roomId) socket.emit("leave:room", roomId);
  },

  // ─── Events ───────────────────────────────────────────────
  emit: (event, data) => {
    const socket = get().socket;
    if (socket?.connected) socket.emit(event, data);
  },

  on: (event, handler) => {
    const socket = get().socket;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  },

  off: (event) => {
    const socket = get().socket;
    if (socket) socket.off(event);
  },

  // ─── Notifications ────────────────────────────────────────
  loadNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const response = await notificationApi.getAll({ page: 1, limit: 50 });
      set({
        notifications: response?.data?.notifications || [],
        unreadCount: response?.data?.unreadCount || 0,
      });
    } catch (error) {
      console.warn("Could not load notifications:", error.message);
    } finally {
      set({ notificationsLoading: false });
    }
  },

  pushNotification: (notification) => {
    const current = get().notifications;
    if (notification?._id && current.some((item) => item._id === notification._id)) {
      return;
    }
    set({
      notifications: [notification, ...current].slice(0, 50),
      unreadCount: get().unreadCount + (notification?.isRead ? 0 : 1),
    });
  },

  markRead: async (id) => {
    await notificationApi.markRead(id);
    const existing = get().notifications.find((notification) => notification._id === id);
    set({
      notifications: get().notifications.map((notification) =>
        notification._id === id
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification,
      ),
      unreadCount: Math.max(0, get().unreadCount - (existing?.isRead ? 0 : 1)),
    });
  },

  markAllRead: async () => {
    await notificationApi.markAllRead();
    set({
      notifications: get().notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    });
  },

  clearNotifications: async () => {
    await notificationApi.clearAll();
    set({ notifications: [], unreadCount: 0 });
  },

  removeNotification: (id) => {
    set({
      notifications: get().notifications.filter(
        (n) => n._id !== id && n.id !== id,
      ),
    });
  },

  // ─── Helpers ──────────────────────────────────────────────
  ping: () =>
    new Promise((resolve) => {
      const socket = get().socket;
      if (!socket?.connected) return resolve(null);
      const start = Date.now();
      socket.emit("ping:server", () => resolve(Date.now() - start));
    }),

  isConnected: () => get().connected,
}));

export default useSocketStore;
