import mongoose from "mongoose";

const procurementItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, default: "" },
    amount: { type: Number, default: 0 },
  },
  { _id: true },
);

const procurementSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    vendor: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "food_beverage",
        "housekeeping",
        "maintenance",
        "security",
        "general",
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: ["draft", "approved", "ordered", "received", "closed"],
      default: "draft",
    },
    purchaseOrderNumber: {
      type: String,
      unique: true,
      default: () => `PO-${Date.now()}`,
    },
    requiredBy: { type: Date },
    taxRate: { type: Number, default: 0, min: 0 },
    items: { type: [procurementItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

procurementSchema.pre("validate", function (next) {
  if (!this.purchaseOrderNumber) {
    this.purchaseOrderNumber = `PO-${Date.now()}`;
  }

  const items = this.items || [];
  items.forEach((item) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    item.amount = Number((qty * unitPrice).toFixed(2));
  });

  this.subtotal = Number(
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2),
  );
  this.tax = Number(
    ((this.subtotal * Number(this.taxRate || 0)) / 100).toFixed(2),
  );
  this.total = Number((this.subtotal + this.tax).toFixed(2));

  next();
});

export default mongoose.model("Procurement", procurementSchema);
