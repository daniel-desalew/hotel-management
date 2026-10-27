// backend/src/models/Amenity.js
import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    category: {
      type: String,
      enum: [
        "room",
        "bathroom",
        "hotel",
        "food",
        "entertainment",
        "safety",
        "accessibility",
      ],
      default: "room",
    },
    icon: String,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Amenity", amenitySchema);
