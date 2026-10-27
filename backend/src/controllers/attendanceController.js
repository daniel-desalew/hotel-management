import Attendance from "../models/Attendance.js";
import Staff from "../models/Staff.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const calculateHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const minutes = (new Date(checkOut) - new Date(checkIn)) / 60000;
  return Number((minutes / 60).toFixed(2));
};

export const createAttendance = async (req, res, next) => {
  try {
    const { hotelId, staffId, date, status, checkIn, checkOut, notes } =
      req.body;

    if (!hotelId || !staffId || !date) {
      throw new ApiError(400, "hotelId, staffId, and date are required");
    }

    const staffRecord = await Staff.findById(staffId);
    if (!staffRecord) {
      throw new ApiError(404, "Staff record not found");
    }

    const hoursWorked = calculateHours(checkIn, checkOut);
    const attendance = await Attendance.create({
      hotelId,
      staffId,
      date: new Date(date),
      status: status || "present",
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      hoursWorked,
      notes,
    });

    const populated = await attendance.populate(
      "staffId",
      "employeeId designation department userId",
    );
    await populated.populate("staffId.userId", "firstName lastName");

    res
      .status(201)
      .json(new ApiResponse(201, populated, "Attendance recorded"));
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRecords = async (req, res, next) => {
  try {
    const { hotelId, staffId, status, date, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (staffId) filter.staffId = staffId;
    if (status) filter.status = status;
    if (date)
      filter.date = {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 86400000),
      };

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate("staffId", "employeeId designation department userId")
        .populate("staffId.userId", "firstName lastName")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          records,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Attendance fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const { checkIn, checkOut, status, notes } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) throw new ApiError(404, "Attendance record not found");

    if (checkIn) record.checkIn = new Date(checkIn);
    if (checkOut) record.checkOut = new Date(checkOut);
    if (status) record.status = status;
    if (typeof notes !== "undefined") record.notes = notes;

    record.hoursWorked = calculateHours(record.checkIn, record.checkOut);
    await record.save();

    await record.populate(
      "staffId",
      "employeeId designation department userId",
    );
    await record.populate("staffId.userId", "firstName lastName");

    res.status(200).json(new ApiResponse(200, record, "Attendance updated"));
  } catch (error) {
    next(error);
  }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) throw new ApiError(404, "Attendance record not found");
    res.status(200).json(new ApiResponse(200, null, "Attendance deleted"));
  } catch (error) {
    next(error);
  }
};
