import AuditLog from "../models/AuditLog.js";

/**
 * Factory: returns middleware that logs a specific action
 * Usage: audit('create', 'Booking') — will log when called
 */
export const audit = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  // Intercept the response to log after it completes
  res.json = function (body) {
    // Log asynchronously — don't block the response
    if (res.statusCode < 400) {
      logAudit({
        action,
        entity,
        req,
        entityId: body?.data?._id || req.params.id,
        changes: req.body,
      }).catch((err) => console.error("Audit log failed:", err));
    }
    return originalJson(body);
  };

  next();
};

/**
 * Write an audit log entry
 */
export const logAudit = async ({
  userId,
  hotelId,
  action,
  entity,
  entityId,
  changes,
  description,
  req,
}) => {
  try {
    await AuditLog.create({
      userId: userId || req?.user?._id,
      hotelId: hotelId || req?.user?.hotelId,
      action,
      entity,
      entityId,
      changes,
      description,
      ipAddress: req?.ip || req?.headers["x-forwarded-for"]?.split(",")[0],
      userAgent: req?.headers["user-agent"],
      method: req?.method,
      endpoint: req?.originalUrl,
      statusCode: req?.res?.statusCode,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
};

/**
 * Global request logger — logs every API request (higher overhead)
 */
export const requestLogger = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Only log mutations and errors for perf
    const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
    const isError = res.statusCode >= 400;

    if (isMutation || isError) {
      console.log(
        `[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms) | user: ${req.user?._id || "anon"}`,
      );
    }
  });

  next();
};

/**
 * Log user logins
 */
export const auditLogin = async (req, userId, success = true) => {
  try {
    await AuditLog.create({
      userId,
      action: "login",
      entity: "User",
      entityId: userId,
      description: success ? "Successful login" : "Failed login attempt",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: success ? 200 : 401,
    });
  } catch (err) {
    console.error("Login audit failed:", err.message);
  }
};
