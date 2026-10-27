import dayjs from "dayjs";
import RoomType from "../models/RoomType.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";

/**
 * Determine if a date is a weekend
 */
export const isWeekend = (date) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

/**
 * Get price for a room type on a specific date
 */
export const getRateForDate = (roomType, date) => {
  if (isWeekend(date) && roomType.weekendPrice) {
    return roomType.weekendPrice;
  }
  return roomType.basePrice;
};

/**
 * Calculate total booking price with dynamic rates and taxes
 */
export const calculateBookingPrice = async ({
  roomTypeId,
  checkIn,
  checkOut,
  adults = 1,
  children = 0,
  hotelTaxRate = 10,
  discountCode = null,
  discountPercentage = 0,
}) => {
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) throw new ApiError(404, "Room type not found");

  const start = dayjs(checkIn);
  const end = dayjs(checkOut);
  const nights = end.diff(start, "day");
  if (nights <= 0) throw new ApiError(400, "Invalid date range");

  // Calculate nightly charges
  let roomCharges = 0;
  const nightlyBreakdown = [];
  for (let i = 0; i < nights; i++) {
    const date = start.add(i, "day");
    const rate = getRateForDate(roomType, date.toDate());
    roomCharges += rate;
    nightlyBreakdown.push({
      date: date.format("YYYY-MM-DD"),
      rate,
      isWeekend: isWeekend(date.toDate()),
    });
  }

  // Extra person charges
  let extraCharges = 0;
  const extraAdults = Math.max(0, adults - 2); // assuming base 2 adults
  if (extraAdults > 0 && roomType.extraPersonCharge) {
    const charge = extraAdults * roomType.extraPersonCharge * nights;
    roomCharges += charge;
    extraCharges += charge;
  }
  if (children > 0 && roomType.childCharge) {
    const charge = children * roomType.childCharge * nights;
    roomCharges += charge;
    extraCharges += charge;
  }

  // Discount
  const discount = roomCharges * (discountPercentage / 100);

  // Taxes
  const taxes = (roomCharges - discount) * (hotelTaxRate / 100);

  const totalAmount = roomCharges - discount + taxes;

  return {
    roomType: {
      _id: roomType._id,
      name: roomType.name,
      code: roomType.code,
    },
    nights,
    nightlyBreakdown,
    roomCharges: Math.round(roomCharges * 100) / 100,
    extraCharges: Math.round(extraCharges * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    currency: "USD",
  };
};

/**
 * Validate and apply a discount code
 */
const DISCOUNT_CODES = {
  WELCOME10: { percentage: 10, description: "10% off for new guests" },
  SUMMER20: { percentage: 20, description: "20% summer discount" },
  LONGSTAY15: { percentage: 15, description: "15% off for 7+ nights" },
};

export const applyDiscountCode = (code, nights) => {
  const entry = DISCOUNT_CODES[code?.toUpperCase()];
  if (!entry) return null;

  // LONGSTAY15 only valid for 7+ nights
  if (code.toUpperCase() === "LONGSTAY15" && nights < 7) return null;

  return entry;
};

/**
 * Calculate tax based on hotel settings
 */
export const calculateTax = (subtotal, taxRate = 10) => {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100;
};

/**
 * Calculate refund amount based on cancellation policy
 * Rule: 100% refund if cancelled 48h+ before check-in, 50% if 24-48h, 0% otherwise
 */
export const calculateRefund = (booking, cancelledAt = new Date()) => {
  const hoursBeforeCheckIn = dayjs(booking.checkIn).diff(
    dayjs(cancelledAt),
    "hour",
  );
  const paidAmount = booking.pricing.paidAmount || 0;

  if (hoursBeforeCheckIn >= 48) {
    return { amount: paidAmount, percentage: 100 };
  }
  if (hoursBeforeCheckIn >= 24) {
    return { amount: Math.round(paidAmount * 0.5 * 100) / 100, percentage: 50 };
  }
  return { amount: 0, percentage: 0 };
};

/**
 * Generate daily rate calendar for a room type (for next N days)
 */
export const getRateCalendar = async (roomTypeId, days = 30) => {
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) throw new ApiError(404, "Room type not found");

  const calendar = [];
  const today = dayjs();

  for (let i = 0; i < days; i++) {
    const date = today.add(i, "day");
    calendar.push({
      date: date.format("YYYY-MM-DD"),
      rate: getRateForDate(roomType, date.toDate()),
      isWeekend: isWeekend(date.toDate()),
    });
  }

  return calendar;
};

/**
 * Dynamic pricing: increase price if occupancy is high
 */
export const getDynamicRate = async (hotelId, roomTypeId, date) => {
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) throw new ApiError(404, "Room type not found");

  const baseRate = getRateForDate(roomType, date);

  // Count bookings for that date
  const start = dayjs(date).startOf("day").toDate();
  const end = dayjs(date).endOf("day").toDate();

  const bookingsCount = await Booking.countDocuments({
    hotelId,
    "rooms.roomTypeId": roomTypeId,
    status: { $in: ["confirmed", "checked_in"] },
    checkIn: { $lte: end },
    checkOut: { $gte: start },
  });

  // If > 80% booked, apply surge pricing
  const occupancyRatio = bookingsCount / (roomType.totalRooms || 1);
  let multiplier = 1;
  if (occupancyRatio > 0.9) multiplier = 1.5;
  else if (occupancyRatio > 0.8) multiplier = 1.3;
  else if (occupancyRatio > 0.7) multiplier = 1.15;

  return {
    baseRate,
    dynamicRate: Math.round(baseRate * multiplier * 100) / 100,
    multiplier,
    occupancyRatio: Math.round(occupancyRatio * 100) / 100,
  };
};
