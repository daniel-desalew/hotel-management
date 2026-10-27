// ─── User Roles ────────────────────────────────────────────────
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  HOTEL_ADMIN: "hotel_admin",
  MANAGER: "manager",
  RECEPTIONIST: "receptionist",
  HOUSEKEEPING: "housekeeping",
  GUEST: "guest",
};

// ─── Booking Status ────────────────────────────────────────────
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

// ─── Payment Status ────────────────────────────────────────────
export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
};

// ─── Payment Methods ───────────────────────────────────────────
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  UPI: "upi",
  NET_BANKING: "net_banking",
  WALLET: "wallet",
  BANK_TRANSFER: "bank_transfer",
};

// ─── Room Status ───────────────────────────────────────────────
export const ROOM_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  CLEANING: "cleaning",
  MAINTENANCE: "maintenance",
  OUT_OF_ORDER: "out_of_order",
};

// ─── Housekeeping Status ───────────────────────────────────────
export const HOUSEKEEPING_STATUS = {
  CLEAN: "clean",
  DIRTY: "dirty",
  INSPECTED: "inspected",
  IN_PROGRESS: "in_progress",
};

// ─── Housekeeping Task Types ───────────────────────────────────
export const HOUSEKEEPING_TASK_TYPES = {
  DAILY_CLEANING: "daily_cleaning",
  DEEP_CLEANING: "deep_cleaning",
  CHECKOUT_CLEANING: "checkout_cleaning",
  TURNDOWN: "turndown",
  MAINTENANCE: "maintenance",
};

// ─── Booking Sources ───────────────────────────────────────────
export const BOOKING_SOURCES = {
  DIRECT: "direct",
  WEBSITE: "website",
  PHONE: "phone",
  WALK_IN: "walk_in",
  BOOKING_COM: "booking_com",
  EXPEDIA: "expedia",
  AIRBNB: "airbnb",
  AGENT: "agent",
};

// ─── Hotel Categories ──────────────────────────────────────────
export const HOTEL_CATEGORIES = {
  ONE_STAR: "1_star",
  TWO_STAR: "2_star",
  THREE_STAR: "3_star",
  FOUR_STAR: "4_star",
  FIVE_STAR: "5_star",
};

// ─── Loyalty Tiers ─────────────────────────────────────────────
export const LOYALTY_TIERS = {
  NONE: "none",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
};

export const LOYALTY_THRESHOLDS = {
  silver: 500, // points
  gold: 2000,
  platinum: 5000,
};

// ─── Discount Codes ────────────────────────────────────────────
export const DISCOUNT_CODES = {
  WELCOME10: { percentage: 10, description: "10% off for new guests" },
  SUMMER20: { percentage: 20, description: "20% summer discount" },
  LONGSTAY15: { percentage: 15, description: "15% off for 7+ nights" },
};

// ─── App Config ────────────────────────────────────────────────
export const DEFAULT_TAX_RATE = 10;
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_TIMEZONE = "UTC";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ─── Cancellation Policy (in hours before check-in) ────────────
export const REFUND_POLICY = {
  FULL_REFUND_HOURS: 48,
  HALF_REFUND_HOURS: 24,
};

// ─── JWT ───────────────────────────────────────────────────────
export const JWT_CONFIG = {
  ACCESS_EXPIRES: "15m",
  REFRESH_EXPIRES: "7d",
};

// ─── Loyalty Points ────────────────────────────────────────────
export const LOYALTY_POINTS_PER_DOLLAR = 0.1; // 1 point per $10
