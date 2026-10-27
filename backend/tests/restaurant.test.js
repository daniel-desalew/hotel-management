import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";

describe("Restaurant POS API", () => {
  const base = "/api/v1/restaurant-orders";
  let authToken, hotel;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
  });

  it("should create a restaurant order with computed totals", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        tableNumber: "A12",
        guestName: "John Doe",
        items: [
          { itemName: "Grilled Chicken", qty: 2, unitPrice: 18 },
          { itemName: "Coca Cola", qty: 1, unitPrice: 4 },
        ],
        taxRate: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(40);
    expect(res.body.data.tax).toBe(4);
    expect(res.body.data.total).toBe(44);
  });

  it("should list restaurant orders for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        tableNumber: "B07",
        guestName: "Jane Smith",
        items: [{ itemName: "Burger", qty: 2, unitPrice: 12 }],
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
  });
});
