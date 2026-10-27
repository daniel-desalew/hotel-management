import request from "supertest";
import app from "../src/app.js";
import { createUser, createHotel, getAuthToken } from "./helpers/factory.js";
import Staff from "../src/models/Staff.js";
import User from "../src/models/User.js";

describe("Payroll API", () => {
  const base = "/api/v1/payroll";
  let authToken, hotel, staffUser, staffMember;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();

    staffUser = await User.create({
      firstName: "Alice",
      lastName: "Jones",
      email: `payroll${Date.now()}@hotelms.test`,
      phone: "9999999999",
      password: "Password123",
      role: "housekeeping",
      isEmailVerified: true,
    });

    staffMember = await Staff.create({
      userId: staffUser._id,
      hotelId: hotel._id,
      employeeId: `PAY-${Date.now()}`,
      designation: "Housekeeping Agent",
      department: "housekeeping",
      joiningDate: new Date(),
      salary: 1500,
      shift: "morning",
    });
  });

  it("should create a payroll record with computed net pay", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        staffId: staffMember._id.toString(),
        period: "2026-10",
        baseSalary: 1500,
        overtimeHours: 4,
        allowances: 120,
        deductions: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.netPay).toBe(1607.5);
  });

  it("should list payroll records for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        staffId: staffMember._id.toString(),
        period: "2026-10",
        baseSalary: 1500,
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
  });
});
