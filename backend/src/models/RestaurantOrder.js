import mongoose from "mongoose";

const restaurantItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, default: "" },
    amount: { type: Number, default: 0 },
  },
  { _id: true },
);

const restaurantOrderSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    guestName: { type: String, default: "Walk-in Guest" },
    tableNumber: { type: String, default: "" },
    orderNumber: {
      type: String,
      unique: true,
      default: () => `POS-${Date.now()}`,
    },
    items: { type: [restaurantItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "in_progress", "served", "paid"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    taxRate: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true },
);

restaurantOrderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `POS-${Date.now()}`;
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

restaurantOrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `POS-${Date.now()}`;
  }
  next();
});

export default mongoose.model("RestaurantOrder", restaurantOrderSchema);
