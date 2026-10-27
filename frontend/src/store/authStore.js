import { create } from "zustand";
import { authApi } from "../api/authApi";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "hotel_user";

/**
 * Persist user to localStorage (excluding tokens)
 */
const persistUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

/**
 * Read cached user from localStorage
 */
const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────
  user: readCachedUser(),
  loading: true, // true while bootstrapping the app
  initialized: false, // true once init() finishes
  error: null,

  // ─── Actions ───────────────────────────────────────────────

  /**
   * Bootstrap auth from stored token (called on app mount)
   */
  init: async () => {
    const token = localStorage.getItem(ACCESS_KEY);

    if (!token) {
      set({ user: null, loading: false, initialized: true });
      return;
    }

    try {
      const res = await authApi.me();
      const user = res.data;
      persistUser(user);
      set({ user, loading: false, initialized: true, error: null });
    } catch (err) {
      // Token invalid/expired and refresh failed
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      persistUser(null);
      set({
        user: null,
        loading: false,
        initialized: true,
        error: err.message,
      });
    }
  },

  /**
   * Login with email + password
   */
  login: async ({ email, password }) => {
    set({ error: null });
    const res = await authApi.login({ email, password });
    const { user, accessToken, refreshToken } = res.data;

    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    persistUser(user);

    set({ user, error: null });
    return user;
  },

  /**
   * Register a new account
   */
  register: async (data) => {
    set({ error: null });
    const res = await authApi.register(data);
    const { user, accessToken, refreshToken } = res.data;

    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    persistUser(user);

    set({ user, error: null });
    return user;
  },

  /**
   * Logout — clears everything
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    persistUser(null);
    set({ user: null, error: null });
  },

  /**
   * Force logout (used by axios interceptor on 401)
   */
  forceLogout: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    persistUser(null);
    set({ user: null, error: "Session expired. Please log in again." });
  },

  /**
   * Update profile fields (name, phone, avatar, etc.)
   */
  updateProfile: async (updates) => {
    const current = get().user;
    if (!current) throw new Error("Not authenticated");

    // Optimistic update
    const optimistic = { ...current, ...updates };
    persistUser(optimistic);
    set({ user: optimistic });

    try {
      const res = await authApi.updateProfile?.(updates);
      if (res?.data) {
        persistUser(res.data);
        set({ user: res.data });
      }
      return optimistic;
    } catch (err) {
      // rollback
      persistUser(current);
      set({ user: current });
      throw err;
    }
  },

  /**
   * Change password
   */
  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await authApi.changePassword?.({
      currentPassword,
      newPassword,
    });
    return res?.data;
  },

  /**
   * Refresh access token manually
   */
  refreshSession: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error("No refresh token");

    const res = await authApi.refresh(refreshToken);
    const { accessToken } = res.data;
    localStorage.setItem(ACCESS_KEY, accessToken);
    return accessToken;
  },

  // ─── Selectors ─────────────────────────────────────────────

  isAuthenticated: () => !!get().user,

  getToken: () => localStorage.getItem(ACCESS_KEY),

  hasRole: (...roles) => {
    const user = get().user;
    return !!user && roles.includes(user.role);
  },

  hasAnyRole: (...roles) => {
    const user = get().user;
    return !!user && roles.includes(user.role);
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;

    const matrix = {
      super_admin: ["*"],
      hotel_admin: [
        "hotel:read",
        "hotel:update",
        "room:*",
        "roomType:*",
        "booking:*",
        "payment:*",
        "guest:*",
        "staff:*",
        "housekeeping:*",
        "review:*",
        "report:read",
        "dashboard:read",
      ],
      manager: [
        "hotel:read",
        "room:read",
        "room:update",
        "room:status",
        "roomType:read",
        "booking:*",
        "payment:*",
        "guest:*",
        "staff:read",
        "housekeeping:*",
        "review:*",
        "report:read",
        "dashboard:read",
      ],
      receptionist: [
        "hotel:read",
        "room:read",
        "room:status",
        "roomType:read",
        "booking:read",
        "booking:create",
        "booking:update",
        "booking:check_in",
        "booking:check_out",
        "payment:read",
        "payment:create",
        "guest:read",
        "guest:create",
        "guest:update",
        "housekeeping:read",
        "housekeeping:create",
        "dashboard:read",
      ],
      housekeeping: [
        "hotel:read",
        "room:read",
        "room:status",
        "housekeeping:read",
        "housekeeping:update",
        "housekeeping:complete",
      ],
      guest: [
        "hotel:read",
        "room:read",
        "roomType:read",
        "booking:create",
        "booking:read_own",
        "review:create",
      ],
    };

    const perms = matrix[user.role] || [];
    if (perms.includes("*")) return true;

    const [resource] = permission.split(":");
    return perms.some((p) => p === permission || p === `${resource}:*`);
  },

  isSuperAdmin: () => get().user?.role === "super_admin",
  isAdmin: () => ["super_admin", "hotel_admin"].includes(get().user?.role),
  isManager: () =>
    ["super_admin", "hotel_admin", "manager"].includes(get().user?.role),
  isStaff: () =>
    [
      "super_admin",
      "hotel_admin",
      "manager",
      "receptionist",
      "housekeeping",
    ].includes(get().user?.role),
  isFrontDesk: () =>
    ["super_admin", "hotel_admin", "manager", "receptionist"].includes(
      get().user?.role,
    ),

  getHotelId: () => get().user?.hotelId || null,

  getFullName: () => {
    const user = get().user;
    return user ? `${user.firstName} ${user.lastName}`.trim() : "";
  },

  getInitials: () => {
    const user = get().user;
    if (!user) return "";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  },
}));

export default useAuthStore;
