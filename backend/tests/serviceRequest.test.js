import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";

describe("Service Request API", () => {
  const base = "/api/v1/service-requests";
  let authToken, hotel;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
  });

  it("should create a guest service request", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestName: "Alice Johnson",
        requestType: "room_service",
        title: "Extra pillows requested",
        description: "I need two extra pillows and a blanket for the room.",
        priority: "medium",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Extra pillows requested");
    expect(res.body.data.status).toBe("open");
  });

  it("should list service requests for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestName: "Bob Lee",
        requestType: "laundry",
        title: "Laundry pickup",
        description: "Please pick up laundry from room 204.",
        priority: "low",
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.requests.length).toBe(1);
  });
});
