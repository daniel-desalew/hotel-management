import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half_day", "leave"],
      default: "present",
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    hoursWorked: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

attendanceSchema.index({ hotelId: 1, date: 1 });
attendanceSchema.index({ staffId: 1, date: 1 });

attendanceSchema.pre("save", function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut) - new Date(this.checkIn);
    this.hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  } else {
    this.hoursWorked = 0;
  }

  next();
});

export default mongoose.model("Attendance", attendanceSchema);
