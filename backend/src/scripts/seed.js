// backend/src/scripts/seed.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import Room from "../models/Room.js";
import Guest from "../models/Guest.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(14, 0, 0, 0);
  return d;
};

const seed = async () => {
  try {
    console.log("🌱 Seeding database...\n");

    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/hotel_management",
    );
    console.log("✅ Connected to MongoDB\n");

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Hotel.deleteMany({}),
      RoomType.deleteMany({}),
      Room.deleteMany({}),
      Guest.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log("🧹 Cleared existing data\n");

    // 1. Hotel
    const hotel = await Hotel.create({
      name: "Grand Plaza Hotel",
      code: "GPH001",
      category: "4_star",
      type: "hotel",
      description: "A luxurious 4-star hotel in the heart of New York",
      address: {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        country: "USA",
        zipCode: "10001",
      },
      contact: {
        phone: "+1-555-0100",
        email: "info@grandplaza.com",
      },
      taxRate: 10,
      currency: "USD",
    });
    console.log(`🏨 Hotel: ${hotel.name}`);

    // 2. Users
    await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "super@hotel.com",
      phone: "1000000001",
      password: "Password123",
      role: "super_admin",
    });

    await User.create({
      firstName: "Daniel",
      lastName: "Admin",
      email: "admin@hotel.com",
      phone: "1000000002",
      password: "Password123",
      role: "hotel_admin",
      hotelId: hotel._id,
    });

    await User.create({
      firstName: "Maria",
      lastName: "Manager",
      email: "manager@hotel.com",
      phone: "1000000003",
      password: "Password123",
      role: "manager",
      hotelId: hotel._id,
    });

    await User.create({
      firstName: "Ravi",
      lastName: "Front",
      email: "reception@hotel.com",
      phone: "1000000004",
      password: "Password123",
      role: "receptionist",
      hotelId: hotel._id,
    });

    await User.create({
      firstName: "Helen",
      lastName: "Housekeeping",
      email: "housekeeping@hotel.com",
      phone: "1000000005",
      password: "Password123",
      role: "housekeeping",
      hotelId: hotel._id,
    });
    console.log("👥 5 users created");

    // 3. Room Types
    const standardType = await RoomType.create({
      hotelId: hotel._id,
      name: "Standard Room",
      code: "STD",
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 1,
      basePrice: 120,
      weekendPrice: 150,
      totalRooms: 10,
      size: 250,
      bedConfiguration: [{ bedType: "queen", count: 1 }],
    });

    const deluxeType = await RoomType.create({
      hotelId: hotel._id,
      name: "Deluxe Room",
      code: "DLX",
      maxOccupancy: 3,
      maxAdults: 3,
      maxChildren: 1,
      basePrice: 200,
      weekendPrice: 250,
      totalRooms: 6,
      size: 400,
      bedConfiguration: [{ bedType: "king", count: 1 }],
    });

    const suiteType = await RoomType.create({
      hotelId: hotel._id,
      name: "Executive Suite",
      code: "STE",
      maxOccupancy: 4,
      maxAdults: 3,
      maxChildren: 2,
      basePrice: 350,
      weekendPrice: 420,
      totalRooms: 4,
      size: 700,
      bedConfiguration: [
        { bedType: "king", count: 1 },
        { bedType: "sofa_bed", count: 1 },
      ],
    });
    console.log("🛏️  3 room types created");

    // 4. Rooms
    const rooms = [];
    for (let i = 1; i <= 10; i++) {
      rooms.push({
        hotelId: hotel._id,
        roomNumber: `1${String(i).padStart(2, "0")}`,
        floor: 1,
        roomTypeId: standardType._id,
        status: "available",
        housekeepingStatus: "clean",
      });
    }
    for (let i = 1; i <= 6; i++) {
      rooms.push({
        hotelId: hotel._id,
        roomNumber: `2${String(i).padStart(2, "0")}`,
        floor: 2,
        roomTypeId: deluxeType._id,
        status: "available",
        housekeepingStatus: "clean",
      });
    }
    for (let i = 1; i <= 4; i++) {
      rooms.push({
        hotelId: hotel._id,
        roomNumber: `3${String(i).padStart(2, "0")}`,
        floor: 3,
        roomTypeId: suiteType._id,
        status: "available",
        housekeepingStatus: "clean",
      });
    }
    const createdRooms = await Room.insertMany(rooms);
    console.log(`🚪 ${createdRooms.length} rooms created`);

    // 5. Guests
    const guestNames = [
      ["Alice", "Smith"],
      ["Bob", "Johnson"],
      ["Carol", "Williams"],
      ["David", "Brown"],
      ["Emma", "Davis"],
      ["Frank", "Miller"],
      ["Grace", "Wilson"],
      ["Henry", "Moore"],
      ["Ivy", "Taylor"],
      ["Jack", "Anderson"],
    ];
    const guests = await Guest.insertMany(
      guestNames.map(([first, last], i) => ({
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        phone: `5550000${String(i + 1).padStart(3, "0")}`,
      })),
    );
    console.log(`👤 ${guests.length} guests created`);

    // 6. Bookings with real dates
    const today = daysFromNow(0);

    const bookingsData = [
      {
        // Booking 1: Check-in TODAY, 3 nights, Standard (checked in)
        guest: guests[0],
        room: createdRooms[0],
        type: standardType,
        checkIn: today,
        checkOut: daysFromNow(3),
        status: "checked_in",
        nights: 3,
      },
      {
        // Booking 2: Check-in TODAY, 2 nights, Deluxe (checked in)
        guest: guests[1],
        room: createdRooms[10],
        type: deluxeType,
        checkIn: today,
        checkOut: daysFromNow(2),
        status: "checked_in",
        nights: 2,
      },
      {
        // Booking 3: Check-in TODAY, 1 night, Suite (checked in)
        guest: guests[2],
        room: createdRooms[16],
        type: suiteType,
        checkIn: today,
        checkOut: daysFromNow(1),
        status: "checked_in",
        nights: 1,
      },
      {
        // Booking 4: Check-in tomorrow (confirmed)
        guest: guests[3],
        room: createdRooms[1],
        type: standardType,
        checkIn: daysFromNow(1),
        checkOut: daysFromNow(4),
        status: "confirmed",
        nights: 3,
      },
      {
        // Booking 5: Check-in in 3 days (confirmed)
        guest: guests[4],
        room: createdRooms[11],
        type: deluxeType,
        checkIn: daysFromNow(3),
        checkOut: daysFromNow(6),
        status: "confirmed",
        nights: 3,
      },
      {
        // Booking 6: Checked out 2 days ago (past)
        guest: guests[5],
        room: createdRooms[2],
        type: standardType,
        checkIn: daysFromNow(-4),
        checkOut: daysFromNow(-2),
        status: "checked_out",
        nights: 2,
      },
      {
        // Booking 7: Checked out yesterday
        guest: guests[6],
        room: createdRooms[12],
        type: deluxeType,
        checkIn: daysFromNow(-3),
        checkOut: daysFromNow(-1),
        status: "checked_out",
        nights: 2,
      },
      {
        // Booking 8: Check-in today, departing today (check-out today)
        guest: guests[7],
        room: createdRooms[3],
        type: standardType,
        checkIn: daysFromNow(-2),
        checkOut: today,
        status: "checked_in",
        nights: 2,
      },
    ];

    const bookings = [];
    for (const b of bookingsData) {
      const rate = b.type.basePrice;
      const roomCharges = rate * b.nights;
      const taxes = roomCharges * 0.1;
      const total = roomCharges + taxes;

      bookings.push({
        bookingNumber: `BK${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        hotelId: hotel._id,
        guestId: b.guest._id,
        rooms: [
          {
            roomId: b.room._id,
            roomTypeId: b.type._id,
            ratePerNight: rate,
            guests: { adults: 2, children: 0 },
          },
        ],
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        actualCheckIn:
          b.status === "checked_in" || b.status === "checked_out"
            ? b.checkIn
            : undefined,
        actualCheckOut: b.status === "checked_out" ? b.checkOut : undefined,
        nights: b.nights,
        totalGuests: { adults: 2, children: 0 },
        pricing: {
          roomCharges,
          taxes,
          totalAmount: total,
          paidAmount: total,
          balanceAmount: 0,
        },
        status: b.status,
        paymentStatus: "paid",
        source: "direct",
      });
    }

    const createdBookings = await Booking.insertMany(bookings);
    console.log(`📅 ${createdBookings.length} bookings created`);

    // Set occupied rooms
    const occupiedRoomIds = createdBookings
      .filter((b) => b.status === "checked_in")
      .flatMap((b) => b.rooms.map((r) => r.roomId));

    await Room.updateMany(
      { _id: { $in: occupiedRoomIds } },
      { $set: { status: "occupied" } },
    );
    console.log(`🔒 ${occupiedRoomIds.length} rooms set to occupied`);

    // 7. Payments
    const payments = createdBookings.map((b) => ({
      paymentNumber: `PAY${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      bookingId: b._id,
      hotelId: hotel._id,
      guestId: b.guestId,
      amount: b.pricing.totalAmount,
      currency: "USD",
      method: "credit_card",
      type: "payment",
      status: "completed",
    }));
    await Payment.insertMany(payments);
    console.log(`💳 ${payments.length} payments created`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SEED COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 LOGIN:");
    console.log("   Email:    admin@hotel.com");
    console.log("   Password: Password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seed();
