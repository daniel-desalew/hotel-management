import request from "supertest";
import app from "../src/app.js";
import {
  createUser,
  createHotel,
  createRoomType,
  createRoom,
  getAuthToken,
} from "./helpers/factory.js";

describe("Maintenance API", () => {
  const base = "/api/v1/maintenance";
  let authToken, hotel, roomType, room;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
    roomType = await createRoomType(hotel._id);
    room = await createRoom(hotel._id, roomType._id, { roomNumber: "405" });
  });

  it("should create a maintenance request", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        roomId: room._id.toString(),
        title: "Air conditioner not cooling",
        description: "The AC unit in room 405 is blowing warm air.",
        category: "hvac",
        priority: "high",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Air conditioner not cooling");
    expect(res.body.data.status).toBe("open");
  });

  it("should list all maintenance requests for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        roomId: room._id.toString(),
        title: "Leaking faucet",
        description: "Kitchen sink keeps leaking.",
        category: "plumbing",
        priority: "medium",
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.requests.length).toBe(1);
  });
});
