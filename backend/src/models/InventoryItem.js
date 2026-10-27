import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "housekeeping",
        "food_beverage",
        "maintenance",
        "front_office",
        "other",
      ],
      default: "other",
    },
    stock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    unit: { type: String, default: "units" },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    supplier: { type: String, default: "" },
    notes: String,
  },
  { timestamps: true },
);

inventoryItemSchema.index({ hotelId: 1, category: 1 });
inventoryItemSchema.index({ hotelId: 1, status: 1 });

export default mongoose.model("InventoryItem", inventoryItemSchema);
