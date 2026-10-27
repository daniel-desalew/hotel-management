import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const Hotel = (await import("./src/models/hotel.js")).default;
const User = (await import("./src/models/user.js")).default;

const hotel = await Hotel.findOneAndUpdate(
  { code: "HOTEL-001" },
  {
    $setOnInsert: {
      name: "HotelMS Demo",
      code: "HOTEL-001",
      category: "4_star",
      type: "hotel",
      address: { city: "New York", country: "USA" },
      currency: "USD",
      timezone: "UTC",
      isActive: true,
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const email = "admin@hotelms.test";
let user = await User.findOne({ email });

if (!user) {
  user = await User.create({
    firstName: "Admin",
    lastName: "User",
    email,
    phone: "5550000000",
    password: "Admin123",
    role: "hotel_admin",
    hotelId: hotel._id,
    isActive: true,
  });
} else {
  user.role = "hotel_admin";
  user.hotelId = hotel._id;
  user.isActive = true;
  await user.save();
}

console.log(
  JSON.stringify(
    {
      hotelId: hotel._id.toString(),
      userId: user._id.toString(),
      email,
      role: user.role,
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
