import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";

describe("Procurement API", () => {
  const base = "/api/v1/procurement";
  let authToken, hotel;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
  });

  it("should create a purchase order with calculated totals", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        vendor: "FreshSupply Co.",
        category: "food_beverage",
        items: [
          { itemName: "Rice Bags", qty: 10, unitPrice: 18 },
          { itemName: "Milk Packets", qty: 20, unitPrice: 2 },
        ],
        taxRate: 8,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(220);
    expect(res.body.data.tax).toBe(17.6);
    expect(res.body.data.total).toBe(237.6);
  });

  it("should list procurement orders for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        vendor: "Local Market",
        category: "housekeeping",
        items: [{ itemName: "Soap", qty: 30, unitPrice: 1.5 }],
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
  });
});
