import { body, param, query } from "express-validator";

export const checkAvailabilityValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotel ID required"),
  body("checkIn")
    .isISO8601()
    .withMessage("Valid check-in date required")
    .toDate(),
  body("checkOut")
    .isISO8601()
    .withMessage("Valid check-out date required")
    .toDate()
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.checkIn)) {
        throw new Error("Check-out must be after check-in");
      }
      return true;
    }),
  body("roomTypeId").optional().isMongoId().withMessage("Invalid room type ID"),
];

export const createBookingValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotel ID required"),
  body("guestId").isMongoId().withMessage("Valid guest ID required"),
  body("roomTypeId").isMongoId().withMessage("Valid room type ID required"),
  body("checkIn")
    .isISO8601()
    .withMessage("Valid check-in date required")
    .toDate()
    .custom((value) => {
      if (new Date(value) < new Date(new Date().setHours(0, 0, 0, 0))) {
        throw new Error("Check-in cannot be in the past");
      }
      return true;
    }),
  body("checkOut")
    .isISO8601()
    .withMessage("Valid check-out date required")
    .toDate()
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.checkIn)) {
        throw new Error("Check-out must be after check-in");
      }
      return true;
    }),
  body("adults")
    .isInt({ min: 1, max: 20 })
    .withMessage("Adults must be 1-20")
    .toInt(),
  body("children")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Children must be 0-10")
    .toInt(),
  body("source")
    .optional()
    .isIn([
      "direct",
      "website",
      "phone",
      "walk_in",
      "booking_com",
      "expedia",
      "airbnb",
      "agent",
    ])
    .withMessage("Invalid booking source"),
  body("specialRequests").optional().trim().isLength({ max: 500 }),
];

export const updateBookingValidator = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("checkIn").optional().isISO8601().toDate(),
  body("checkOut").optional().isISO8601().toDate(),
  body("specialRequests").optional().trim().isLength({ max: 500 }),
];

export const checkInValidator = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("idProofType")
    .optional()
    .isIn(["passport", "driving_license", "national_id", "aadhaar"])
    .withMessage("Invalid ID proof type"),
  body("idProofNumber").optional().trim(),
  body("idProofImage").optional().isString(),
];

export const cancelBookingValidator = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("reason").optional().trim().isLength({ max: 300 }),
];

export const searchBookingsValidator = [
  query("hotelId").optional().isMongoId(),
  query("status").optional().isString(),
  query("source").optional().isString(),
  query("fromDate").optional().isISO8601(),
  query("toDate").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];
