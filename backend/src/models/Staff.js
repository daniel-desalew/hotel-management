import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    employeeId: { type: String, unique: true, required: true },
    designation: { type: String, required: true },
    department: {
      type: String,
      enum: [
        "front_desk",
        "housekeeping",
        "food_beverage",
        "maintenance",
        "security",
        "management",
        "other",
      ],
      default: "front_desk",
    },
    joiningDate: { type: Date, required: true },
    salary: { type: Number, min: 0 },
    shift: {
      type: String,
      enum: ["morning", "evening", "night", "rotational"],
      default: "morning",
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    documents: [{ name: String, url: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

staffSchema.index({ hotelId: 1, department: 1 });
export default mongoose.model("Staff", staffSchema);
