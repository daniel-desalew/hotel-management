import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";

describe("Inventory API", () => {
  const base = "/api/v1/inventory";
  let authToken, hotel;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
  });

  it("should create an inventory item", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        name: "Toilet paper",
        category: "housekeeping",
        stock: 120,
        reorderLevel: 30,
        unit: "rolls",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Toilet paper");
    expect(res.body.data.stock).toBe(120);
  });

  it("should list inventory items for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        name: "Soap dispenser",
        category: "housekeeping",
        stock: 80,
        reorderLevel: 15,
        unit: "pieces",
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
  });
});
