import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { createUser, getAuthToken } from "./helpers/factory.js";

describe("Auth API", () => {
  const base = "/api/v1/auth";

  describe("POST /register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post(`${base}/register`).send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
        password: "Password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("john@example.com");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post(`${base}/register`).send({
        firstName: "John",
        lastName: "Doe",
        email: "not-an-email",
        phone: "1234567890",
        password: "Password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject weak password", async () => {
      const res = await request(app).post(`${base}/register`).send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
        password: "weak",
      });

      expect(res.status).toBe(400);
    });

    it("should reject duplicate email", async () => {
      await User.create({
        firstName: "A",
        lastName: "B",
        email: "dup@example.com",
        phone: "1111111111",
        password: "Password123",
      });

      const res = await request(app).post(`${base}/register`).send({
        firstName: "C",
        lastName: "D",
        email: "dup@example.com",
        phone: "2222222222",
        password: "Password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe("POST /login", () => {
    it("should login with valid credentials", async () => {
      const { user, plainPassword } = await createUser({
        email: "login@example.com",
      });

      const res = await request(app).post(`${base}/login`).send({
        email: "login@example.com",
        password: plainPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe("login@example.com");
    });

    it("should reject wrong password", async () => {
      await createUser({ email: "wrong@example.com" });

      const res = await request(app).post(`${base}/login`).send({
        email: "wrong@example.com",
        password: "WrongPassword123",
      });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post(`${base}/login`).send({
        email: "nouser@example.com",
        password: "Password123",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /me", () => {
    it("should return current user with valid token", async () => {
      const { user } = await createUser();
      const token = getAuthToken(user);

      const res = await request(app)
        .get(`${base}/me`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(user._id.toString());
    });

    it("should reject missing token", async () => {
      const res = await request(app).get(`${base}/me`);
      expect(res.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get(`${base}/me`)
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /me", () => {
    it("should update the current user's profile", async () => {
      const { user } = await createUser();
      const token = getAuthToken(user);

      const res = await request(app)
        .patch(`${base}/me`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "Updated",
          lastName: "User",
          phone: "9876543210",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe("Updated");
      expect(res.body.data.phone).toBe("9876543210");
    });
  });

  describe("POST /change-password", () => {
    it("should change the user's password with the current password", async () => {
      const { user, plainPassword } = await createUser();
      const token = getAuthToken(user);

      const res = await request(app)
        .post(`${base}/change-password`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: plainPassword,
          newPassword: "NewPassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findById(user._id).select("+password");
      const valid = await updated.comparePassword("NewPassword123");
      expect(valid).toBe(true);
    });
  });
});
