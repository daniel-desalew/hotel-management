import Payroll from "../models/Payroll.js";
import Staff from "../models/Staff.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createPayroll = async (req, res, next) => {
  try {
    const {
      hotelId,
      staffId,
      period,
      baseSalary,
      overtimeHours,
      allowances,
      deductions,
      notes,
      status,
    } = req.body;

    if (!hotelId || !staffId || !period) {
      throw new ApiError(400, "hotelId, staffId, and period are required");
    }

    const staff = await Staff.findById(staffId);
    if (!staff) throw new ApiError(404, "Staff not found");

    const payroll = await Payroll.create({
      hotelId,
      staffId,
      period,
      baseSalary: Number(baseSalary ?? staff.salary ?? 0),
      overtimeHours: Number(overtimeHours || 0),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      notes: notes || "",
      status: status || "draft",
    });

    const populated = await payroll.populate(
      "staffId",
      "employeeId designation department userId",
    );
    await populated.populate("staffId.userId", "firstName lastName");

    res.status(201).json(new ApiResponse(201, populated, "Payroll created"));
  } catch (error) {
    next(error);
  }
};

export const getPayrollRecords = async (req, res, next) => {
  try {
    const {
      hotelId,
      staffId,
      period,
      status,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (staffId) filter.staffId = staffId;
    if (period) filter.period = period;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Payroll.find(filter)
        .populate("staffId", "employeeId designation department userId")
        .populate("staffId.userId", "firstName lastName")
        .sort({ period: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payroll.countDocuments(filter),
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
        "Payroll fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updatePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) throw new ApiError(404, "Payroll record not found");

    const allowedFields = [
      "baseSalary",
      "overtimeHours",
      "allowances",
      "deductions",
      "status",
      "notes",
    ];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        payroll[field] =
          field === "baseSalary" ? Number(req.body[field]) : req.body[field];
      }
    });

    await payroll.save();
    await payroll.populate(
      "staffId",
      "employeeId designation department userId",
    );
    await payroll.populate("staffId.userId", "firstName lastName");

    res.status(200).json(new ApiResponse(200, payroll, "Payroll updated"));
  } catch (error) {
    next(error);
  }
};

export const deletePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) throw new ApiError(404, "Payroll record not found");

    res.status(200).json(new ApiResponse(200, null, "Payroll deleted"));
  } catch (error) {
    next(error);
  }
};
