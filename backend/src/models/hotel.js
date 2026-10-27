import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, required: true },
    description: String,
    brand: String,
    category: {
      type: String,
      enum: ["1_star", "2_star", "3_star", "4_star", "5_star"],
      required: true,
    },
    type: {
      type: String,
      enum: ["hotel", "resort", "motel", "hostel", "villa"],
      default: "hotel",
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      zipCode: String,
      coordinates: { lat: Number, lng: Number },
    },
    contact: { phone: String, email: String, website: String },
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],
    images: [{ url: String, caption: String }],
    policies: {
      checkInTime: { type: String, default: "14:00" },
      checkOutTime: { type: String, default: "11:00" },
      cancellationPolicy: String,
      petPolicy: String,
      childPolicy: String,
    },
    taxRate: { type: Number, default: 10 },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    settings: {
      autoAssignRooms: { type: Boolean, default: false },
      requireDeposit: { type: Boolean, default: false },
      depositPercentage: { type: Number, default: 20 },
      overbookingAllowed: { type: Boolean, default: false },
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

hotelSchema.index({ "address.city": 1, "address.country": 1 });
hotelSchema.index({ name: "text", description: "text" });

export default mongoose.model("Hotel", hotelSchema);
