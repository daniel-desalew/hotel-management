import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "check_in",
        "check_out",
        "payment",
        "refund",
        "price_update",
        "status_change",
        "other",
      ],
    },
    entity: { type: String, required: true }, // e.g. 'Booking', 'Room', 'User'
    entityId: { type: mongoose.Schema.Types.ObjectId },
    changes: mongoose.Schema.Types.Mixed, // { before: {...}, after: {...} }
    description: String,
    ipAddress: String,
    userAgent: String,
    method: String,
    endpoint: String,
    statusCode: Number,
  },
  { timestamps: true },
);

auditLogSchema.index({ hotelId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
