import request from "supertest";
import app from "../src/app.js";
import { createUser, getAuthToken } from "./helpers/factory.js";

describe("Notification API", () => {
  const base = "/api/v1/notifications";
  let authToken, user;

  beforeEach(async () => {
    const created = await createUser({ role: "hotel_admin" });
    user = created.user;
    authToken = getAuthToken(user);
  });

  it("should create and list notifications for a user", async () => {
    const createRes = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        userId: user._id.toString(),
        type: "general",
        title: "Welcome back",
        message: "Your account has been updated.",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe("Welcome back");

    const listRes = await request(app)
      .get(`${base}?userId=${user._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.notifications.length).toBeGreaterThanOrEqual(1);
  });
});
