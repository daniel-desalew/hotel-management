import crypto from "crypto";
import dayjs from "dayjs";
import mongoose from "mongoose";

// ─── ID Generation ─────────────────────────────────────────────

/** Generate a unique booking number like BK240119A4F2 */
export const generateBookingNumber = () => {
  const date = dayjs().format("YYMMDD");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `BK${date}${rand}`;
};

/** Generate a unique payment number */
export const generatePaymentNumber = () => {
  const date = dayjs().format("YYMMDD");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `PAY${date}${rand}`;
};

/** Generate a unique invoice number */
export const generateInvoiceNumber = (sequence = 1) => {
  const year = dayjs().format("YYYY");
  return `INV-${year}-${String(sequence).padStart(5, "0")}`;
};

/** Generate a unique employee ID */
export const generateEmployeeId = (hotelCode) => {
  const rand = crypto.randomInt(1000, 9999);
  return `${hotelCode || "HTL"}-${rand}`;
};

/** Generate a random alphanumeric string */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

/** Generate password reset token */
export const generateResetToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
};

// ─── Date Helpers ──────────────────────────────────────────────

export const calculateNights = (checkIn, checkOut) => {
  return dayjs(checkOut).diff(dayjs(checkIn), "day");
};

export const isWeekend = (date) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

export const getDateRange = (from, to) => {
  const dates = [];
  let current = dayjs(from);
  const end = dayjs(to);
  while (current.isBefore(end) || current.isSame(end, "day")) {
    dates.push(current.toDate());
    current = current.add(1, "day");
  }
  return dates;
};

export const formatDate = (date, format = "YYYY-MM-DD") =>
  dayjs(date).format(format);

export const getStartOfDay = (date = new Date()) =>
  dayjs(date).startOf("day").toDate();

export const getEndOfDay = (date = new Date()) =>
  dayjs(date).endOf("day").toDate();

// ─── Number Helpers ────────────────────────────────────────────

export const roundTo = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export const calculatePercentage = (part, total) => {
  if (!total) return 0;
  return roundTo((part / total) * 100, 2);
};

// ─── String Helpers ────────────────────────────────────────────

export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`;
};

// ─── Object Helpers ────────────────────────────────────────────

export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
};

export const omit = (obj, keys) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {});
};

export const cleanObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") acc[key] = value;
    return acc;
  }, {});
};

// ─── Mongo Helpers ─────────────────────────────────────────────

export const toObjectId = (id) => {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

export const buildPagination = (page = 1, limit = 20) => {
  const skip = (Number(page) - 1) * Number(limit);
  return { skip, limit: Number(limit) };
};

// ─── Pricing Helpers ───────────────────────────────────────────

export const calculateLoyaltyPoints = (amount) => {
  return Math.floor(amount / 10);
};

export const getLoyaltyTier = (points) => {
  if (points >= 5000) return "platinum";
  if (points >= 2000) return "gold";
  if (points >= 500) return "silver";
  return "none";
};

// ─── Response Helpers ──────────────────────────────────────────

export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

// ─── Validation Helpers ────────────────────────────────────────

export const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

export const isValidPhone = (phone) => {
  return /^[0-9+\-\s()]{7,20}$/.test(phone);
};

// ─── Async Helpers ─────────────────────────────────────────────

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};
