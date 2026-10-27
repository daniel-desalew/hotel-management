import request from "supertest";
import app from "../src/app.js";
import {
  createUser,
  createHotel,
  createUser as createStaffUser,
  getAuthToken,
} from "./helpers/factory.js";
import Staff from "../src/models/Staff.js";

describe("Attendance API", () => {
  const base = "/api/v1/attendance";
  let authToken, hotel, staffUser, staffMember;

  beforeEach(async () => {
    const { user } = await createUser({ role: "hotel_admin" });
    authToken = getAuthToken(user);
    hotel = await createHotel();
    staffUser = await createStaffUser({
      email: `staff${Date.now()}@hotelms.test`,
      role: "housekeeping",
    });

    staffMember = await Staff.create({
      userId: staffUser.user._id,
      hotelId: hotel._id,
      employeeId: `EMP-${Date.now()}`,
      designation: "Housekeeping Agent",
      department: "housekeeping",
      joiningDate: new Date(),
      salary: 1200,
      shift: "morning",
    });
  });

  it("should create an attendance record", async () => {
    const res = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        staffId: staffMember._id.toString(),
        date: "2026-10-13",
        status: "present",
        checkIn: "2026-10-13T08:00:00",
        checkOut: "2026-10-13T16:30:00",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("present");
    expect(res.body.data.hoursWorked).toBe(8.5);
  });

  it("should list attendance records for a hotel", async () => {
    await request(app)
      .post(base)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        hotelId: hotel._id.toString(),
        staffId: staffMember._id.toString(),
        date: "2026-10-14",
        status: "late",
        checkIn: "2026-10-14T09:15:00",
      });

    const res = await request(app)
      .get(`${base}?hotelId=${hotel._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.records.length).toBe(1);
  });
});
