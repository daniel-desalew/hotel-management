import request from "supertest";
import app from "../src/app.js";
import Booking from "../src/models/Booking.js";
import Guest from "../src/models/Guest.js";
import { createHotel, createUser, getAuthToken } from "./helpers/factory.js";

describe("Invoice API", () => {
  it("should generate an invoice for a booking", async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    const hotel = await createHotel({ code: "INVH1" });
    const guest = await Guest.create({
      firstName: "Invoice",
      lastName: "Guest",
      email: "invoiceguest@example.com",
      phone: "1234567891",
    });

    const booking = await Booking.create({
      bookingNumber: "BKINVTEST001",
      hotelId: hotel._id,
      guestId: guest._id,
      rooms: [
        {
          roomId: null,
          roomTypeId: null,
          ratePerNight: 120,
          guests: { adults: 2, children: 0 },
        },
      ],
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      nights: 2,
      totalGuests: { adults: 2, children: 0 },
      pricing: {
        roomCharges: 240,
        taxes: 24,
        totalAmount: 264,
        paidAmount: 0,
        balanceAmount: 264,
        currency: "USD",
      },
      status: "confirmed",
      paymentStatus: "unpaid",
    });

    const token = getAuthToken(user);
    const res = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookingId: booking._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toMatch(/INV-/);
    expect(res.body.data.totalAmount).toBe(264);
  });
});
