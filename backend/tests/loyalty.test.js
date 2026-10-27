import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";

describe("Loyalty Program API", () => {
  const base = "/api/v1/loyalty";
  let authToken, hotel;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
  });

  it("should create a loyalty member and calculate tier reward", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestName: "Alice Johnson",
        guestEmail: "alice@example.com",
        phone: "1234567890",
        totalPoints: 1500,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tier).toBe("gold");
    expect(res.body.data.pointsBalance).toBe(1500);
  });

  it("should list loyalty members for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestName: "Bob Smith",
        guestEmail: "bob@example.com",
        phone: "9876543210",
        totalPoints: 1200,
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
  });

  it("should redeem points from a loyalty member and update available balance", async () => {
    const createMember = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        guestName: "Charlie Brown",
        guestEmail: "charlie@example.com",
        phone: "1112223333",
        totalPoints: 2000,
      });

    const res = await request(app)
      .post(`${base}/redemptions`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        memberId: createMember.body.data._id,
        hotelId: hotel._id.toString(),
        rewardType: "food_voucher",
        redeemedPoints: 500,
        note: "Complimentary dinner credit",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.redeemedPoints).toBe(500);
    expect(res.body.data.status).toBe("approved");

    const memberRes = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    const updatedMember = memberRes.body.data.members.find(
      (member) => member._id === createMember.body.data._id,
    );

    expect(updatedMember.pointsBalance).toBe(1500);
  });
});
