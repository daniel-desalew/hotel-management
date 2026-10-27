import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
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
    period: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
    },
    grossPay: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "paid"],
      default: "draft",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

payrollSchema.index({ hotelId: 1, period: 1 });
payrollSchema.index({ staffId: 1, period: 1 }, { unique: true });

payrollSchema.pre("save", function (next) {
  const baseSalary = Number(this.baseSalary || 0);
  const overtimeHours = Number(this.overtimeHours || 0);
  const allowances = Number(this.allowances || 0);
  const deductions = Number(this.deductions || 0);

  this.overtimePay = Number(((baseSalary / 160) * overtimeHours).toFixed(2));
  this.grossPay = Number(
    (baseSalary + allowances + this.overtimePay).toFixed(2),
  );
  this.netPay = Number((this.grossPay - deductions).toFixed(2));

  next();
});

export default mongoose.model("Payroll", payrollSchema);
