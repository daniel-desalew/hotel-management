import { body, param, query } from "express-validator";

export const createRoomTypeValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotel ID required"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Room type name required")
    .isLength({ max: 100 }),
  body("code").trim().notEmpty().toUpperCase().isLength({ max: 20 }),
  body("maxOccupancy").isInt({ min: 1, max: 20 }).toInt(),
  body("maxAdults").isInt({ min: 1, max: 20 }).toInt(),
  body("maxChildren").optional().isInt({ min: 0, max: 10 }).toInt(),
  body("basePrice")
    .isFloat({ min: 0 })
    .withMessage("Base price must be >= 0")
    .toFloat(),
  body("weekendPrice").optional().isFloat({ min: 0 }).toFloat(),
  body("extraPersonCharge").optional().isFloat({ min: 0 }).toFloat(),
  body("totalRooms")
    .isInt({ min: 1 })
    .withMessage("Must have at least 1 room")
    .toInt(),
  body("bedConfiguration").optional().isArray(),
];

export const updateRoomTypeValidator = [
  param("id").isMongoId().withMessage("Invalid room type ID"),
  body("name").optional().trim().isLength({ max: 100 }),
  body("basePrice").optional().isFloat({ min: 0 }).toFloat(),
  body("weekendPrice").optional().isFloat({ min: 0 }).toFloat(),
  body("totalRooms").optional().isInt({ min: 1 }).toInt(),
];

export const createRoomValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotel ID required"),
  body("roomNumber")
    .trim()
    .notEmpty()
    .withMessage("Room number required")
    .isLength({ max: 10 }),
  body("floor").isInt({ min: -5, max: 100 }).toInt(),
  body("roomTypeId").isMongoId().withMessage("Valid room type ID required"),
  body("status")
    .optional()
    .isIn([
      "available",
      "occupied",
      "reserved",
      "cleaning",
      "maintenance",
      "out_of_order",
    ]),
  body("features").optional().isArray(),
  body("notes").optional().trim().isLength({ max: 500 }),
];

export const updateRoomValidator = [
  param("id").isMongoId().withMessage("Invalid room ID"),
  body("roomNumber").optional().trim().isLength({ max: 10 }),
  body("floor").optional().isInt({ min: -5, max: 100 }).toInt(),
  body("features").optional().isArray(),
];

export const changeRoomStatusValidator = [
  param("id").isMongoId().withMessage("Invalid room ID"),
  body("status")
    .optional()
    .isIn([
      "available",
      "occupied",
      "reserved",
      "cleaning",
      "maintenance",
      "out_of_order",
    ]),
  body("housekeepingStatus")
    .optional()
    .isIn(["clean", "dirty", "inspected", "in_progress"]),
];

export const listRoomsValidator = [
  query("hotelId").optional().isMongoId(),
  query("status").optional().isString(),
  query("floor").optional().isInt().toInt(),
  query("roomTypeId").optional().isMongoId(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
];
