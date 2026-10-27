import ApiError from "../utils/ApiError.js";

/**
 * Role hierarchy — higher index = more permissions
 */
export const ROLE_HIERARCHY = {
  guest: 0,
  housekeeping: 1,
  receptionist: 2,
  manager: 3,
  hotel_admin: 4,
  super_admin: 5,
};

/**
 * Check if a user's role is at least the given minimum level
 */
export const hasRoleLevel = (userRole, minimumRole) => {
  return (
    (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minimumRole] ?? 999)
  );
};

/**
 * Middleware: require minimum role level
 */
export const requireRoleLevel = (minimumRole) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Authentication required"));
  if (!hasRoleLevel(req.user.role, minimumRole)) {
    return next(new ApiError(403, `Requires ${minimumRole} role or higher`));
  }
  next();
};

/**
 * Middleware: require any of the given roles
 */
export const requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    next();
  };

/**
 * Resource ownership check — user owns the resource or is admin
 */
export const requireOwnership = (getOwnerId) => async (req, res, next) => {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    // Admins bypass
    if (["super_admin", "hotel_admin", "manager"].includes(req.user.role))
      return next();

    const ownerId =
      typeof getOwnerId === "function" ? getOwnerId(req) : getOwnerId;
    if (req.user._id.toString() !== ownerId?.toString()) {
      return next(new ApiError(403, "You do not own this resource"));
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Permission matrix — fine-grained checks per resource:action
 */
export const PERMISSIONS = {
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

/**
 * Check if a role has a specific permission
 * Permission format: 'resource:action' or 'resource:*' or '*'
 */
export const hasPermission = (role, permission) => {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;

  const [resource, action] = permission.split(":");
  return perms.some((p) => {
    if (p === permission) return true;
    if (p === `${resource}:*`) return true;
    return false;
  });
};

/**
 * Middleware factory: require a specific permission
 */
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Authentication required"));
  if (!hasPermission(req.user.role, permission)) {
    return next(new ApiError(403, `Missing permission: ${permission}`));
  }
  next();
};

/**
 * Convenience middleware for common combinations
 */
export const onlyAdmins = requireRoles("super_admin", "hotel_admin");
export const onlyManagers = requireRoles(
  "super_admin",
  "hotel_admin",
  "manager",
);
export const onlyStaff = requireRoles(
  "super_admin",
  "hotel_admin",
  "manager",
  "receptionist",
  "housekeeping",
);
export const onlyFrontDesk = requireRoles(
  "super_admin",
  "hotel_admin",
  "manager",
  "receptionist",
);
