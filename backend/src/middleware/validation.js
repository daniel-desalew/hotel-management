import { validationResult, body, param, query } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Run express-validator chains and return 400 if there are errors
 */
export const validate = (chains) => {
  return [
    ...(Array.isArray(chains) ? chains : [chains]),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formatted = errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
          value: e.value,
        }));
        return next(new ApiError(400, "Validation failed", formatted));
      }
      next();
    },
  ];
};

/**
 * Zod schema validation middleware
 * Usage: validateZod(mySchema) — mySchema should be a Zod object
 */
export const validateZod = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return next(new ApiError(400, "Validation failed", errors));
    }

    // Attach parsed data back (with defaults/transforms applied)
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Common reusable validators
 */
export const commonValidators = {
  mongoId: (field, location = "param") => {
    const map = { body, param, query };
    const validator = map[location];
    return validator(field)
      .isMongoId()
      .withMessage(`${field} must be a valid ID`);
  },

  email: (field = "email", location = "body") => {
    const map = { body, param, query };
    const validator = map[location];
    return validator(field)
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail();
  },

  password: (field = "password", location = "body") =>
    body(field)
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number"),

  dateRange: (startField, endField) => [
    body(startField)
      .isISO8601()
      .withMessage(`${startField} must be a valid date`)
      .toDate(),
    body(endField)
      .isISO8601()
      .withMessage(`${endField} must be a valid date`)
      .toDate()
      .custom((end, { req }) => {
        if (new Date(end) <= new Date(req.body[startField])) {
          throw new Error(`${endField} must be after ${startField}`);
        }
        return true;
      }),
  ],

  positiveInt: (field, location = "body") => {
    const map = { body, param, query };
    const validator = map[location];
    return validator(field)
      .isInt({ min: 0 })
      .withMessage(`${field} must be a positive integer`)
      .toInt();
  },
};
