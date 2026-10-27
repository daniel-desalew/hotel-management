import request from "supertest";
import app from "../src/app.js";
import Booking from "../src/models/Booking.js";
import {
  createUser,
  createHotelWithRooms,
  createGuest,
  getAuthToken,
} from "./helpers/factory.js";

describe("Booking API", () => {
  const base = "/api/v1/bookings";
  let authToken, user, hotel, roomType, rooms, guest;

  beforeEach(async () => {
    const created = await createUser({ role: "hotel_admin" });
    user = created.user;
    authToken = getAuthToken(user);

    const setup = await createHotelWithRooms(3);
    hotel = setup.hotel;
    roomType = setup.roomType;
    rooms = setup.rooms;

    guest = await createGuest();
  });

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const dayAfter = (n = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };

  describe("POST /check-availability", () => {
    it("should return available rooms", async () => {
      const res = await request(app).post(`${base}/check-availability`).send({
        hotelId: hotel._id.toString(),
        checkIn: tomorrow(),
        checkOut: dayAfter(),
        roomTypeId: roomType._id.toString(),
      });

      expect(res.status).toBe(200);
      expect(res.body.data.availableRooms.length).toBe(3);
    });

    it("should return empty when dates invalid", async () => {
      const res = await request(app)
        .post(`${base}/check-availability`)
        .send({
          hotelId: hotel._id.toString(),
          checkIn: dayAfter(5),
          checkOut: tomorrow(),
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    it("should create a booking", async () => {
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          guestId: guest._id.toString(),
          roomTypeId: roomType._id.toString(),
          checkIn: tomorrow(),
          checkOut: dayAfter(),
          adults: 2,
          children: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.bookingNumber).toBeDefined();
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.pricing.totalAmount).toBeGreaterThan(0);
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ hotelId: hotel._id.toString() });

      expect(res.status).toBe(400);
    });

    it("should reject past check-in", async () => {
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          guestId: guest._id.toString(),
          roomTypeId: roomType._id.toString(),
          checkIn: "2020-01-01",
          checkOut: dayAfter(),
          adults: 2,
        });

      expect(res.status).toBe(400);
    });

    it("should not double-book the same room", async () => {
      const payload = {
        hotelId: hotel._id.toString(),
        guestId: guest._id.toString(),
        roomTypeId: roomType._id.toString(),
        checkIn: tomorrow(),
        checkOut: dayAfter(),
        adults: 2,
      };

      // Book all 3 rooms
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(base)
          .set("Authorization", `Bearer ${authToken}`)
          .send(payload);
      }

      // 4th booking should fail
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/no rooms available/i);
    });
  });

  describe("GET /", () => {
    it("should list bookings for a hotel", async () => {
      await Booking.create({
        bookingNumber: "BK-TEST-1",
        hotelId: hotel._id,
        guestId: guest._id,
        rooms: [
          { roomId: rooms[0]._id, roomTypeId: roomType._id, ratePerNight: 100 },
        ],
        checkIn: new Date(tomorrow()),
        checkOut: new Date(dayAfter()),
        nights: 2,
        totalGuests: { adults: 2 },
        pricing: { totalAmount: 200, balanceAmount: 200 },
      });

      const res = await request(app)
        .get(`${base}?hotelId=${hotel._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBe(1);
    });
  });

  describe("Lifecycle: check-in → check-out", () => {
    it("should check in and check out a booking", async () => {
      // Create booking
      const createRes = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          guestId: guest._id.toString(),
          roomTypeId: roomType._id.toString(),
          checkIn: tomorrow(),
          checkOut: dayAfter(),
          adults: 2,
        });

      const bookingId = createRes.body.data._id;

      // Check in
      const checkInRes = await request(app)
        .post(`${base}/${bookingId}/check-in`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ idProofType: "passport", idProofNumber: "A1234567" });

      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.data.status).toBe("checked_in");

      // Check out
      const checkOutRes = await request(app)
        .post(`${base}/${bookingId}/check-out`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.data.status).toBe("checked_out");
    });
  });
});
