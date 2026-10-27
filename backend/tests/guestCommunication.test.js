import request from "supertest";
import app from "../src/app.js";
import {
  createUser,
  createHotel,
  createGuest,
  getAuthToken,
} from "./helpers/factory.js";

describe("Guest Communication API", () => {
  const base = "/api/v1/guest-communications";
  let authToken, hotel, guest;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
    guest = await createGuest();
  });

  it("should create and list guest communications for a hotel", async () => {
    const createRes = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestId: guest._id.toString(),
        guestName: guest.firstName + " " + guest.lastName,
        guestEmail: guest.email,
        channel: "email",
        subject: "Welcome back",
        message: "Thank you for staying with us again.",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.subject).toBe("Welcome back");

    const listRes = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.messages.length).toBeGreaterThanOrEqual(1);
  });
});
