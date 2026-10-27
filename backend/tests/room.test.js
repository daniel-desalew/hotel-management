import request from "supertest";
import app from "../src/app.js";
import {
  createUser,
  createHotel,
  createRoomType,
  getAuthToken,
} from "./helpers/factory.js";

describe("Room API", () => {
  const base = "/api/v1/rooms";
  let authToken, hotel, roomType;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
    roomType = await createRoomType(hotel._id);
  });

  describe("POST /types", () => {
    it("should create a room type", async () => {
      const res = await request(app)
        .post(`${base}/types`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          name: "Presidential Suite",
          code: "PS1",
          maxOccupancy: 4,
          maxAdults: 2,
          basePrice: 999,
          totalRooms: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Presidential Suite");
    });

    it("should reject without auth", async () => {
      const res = await request(app).post(`${base}/types`).send({ name: "X" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /", () => {
    it("should create a room", async () => {
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          roomNumber: "201",
          floor: 2,
          roomTypeId: roomType._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.roomNumber).toBe("201");
      expect(res.body.data.status).toBe("available");
    });

    it("should reject duplicate room number", async () => {
      const payload = {
        hotelId: hotel._id.toString(),
        roomNumber: "201",
        floor: 2,
        roomTypeId: roomType._id.toString(),
      };

      await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);
      const res = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /:id/status", () => {
    it("should change room status", async () => {
      const create = await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          roomNumber: "301",
          floor: 3,
          roomTypeId: roomType._id.toString(),
        });

      const roomId = create.body.data._id;

      const res = await request(app)
        .patch(`${base}/${roomId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "maintenance", housekeepingStatus: "dirty" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("maintenance");
      expect(res.body.data.housekeepingStatus).toBe("dirty");
    });
  });

  describe("GET /", () => {
    it("should list rooms for a hotel", async () => {
      await request(app)
        .post(base)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hotelId: hotel._id.toString(),
          roomNumber: "101",
          floor: 1,
          roomTypeId: roomType._id.toString(),
        });

      const res = await request(app).get(`${base}?hotelId=${hotel._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.rooms.length).toBe(1);
    });
  });
});
