import Staff from "../models/Staff.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc   Add staff
// @route  POST /api/v1/staff
export const createStaff = async (req, res, next) => {
  let createdUser;
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      password,
      role = "receptionist",
      hotelId: requestedHotelId,
      ...staffFields
    } = req.body;

    const hotelId = req.user.role === "super_admin"
      ? requestedHotelId || req.user.hotelId
      : req.user.hotelId;
    if (!hotelId) throw new ApiError(400, "A hotel must be selected");

    let user;
    if (userId) {
      user = await User.findById(userId);
      if (!user) throw new ApiError(404, "User not found");
    } else {
      if (!firstName || !lastName || !email || !phone || !password) {
        throw new ApiError(400, "Name, email, phone, and password are required");
      }
      if (!["manager", "receptionist", "housekeeping"].includes(role)) {
        throw new ApiError(400, "Invalid staff account role");
      }
      [createdUser] = await User.create([{
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        hotelId,
        isEmailVerified: true,
      }]);
      user = createdUser;
    }

    const [staff] = await Staff.create([{
      ...staffFields,
      userId: user._id,
      hotelId,
    }]);
    await staff.populate("userId", "firstName lastName email phone role");
    res.status(201).json(new ApiResponse(201, staff, "Staff added"));
  } catch (error) {
    if (createdUser) await User.findByIdAndDelete(createdUser._id).catch(() => {});
    next(error);
  }
};

// @desc   Get all staff
// @route  GET /api/v1/staff
export const getAllStaff = async (req, res, next) => {
  try {
    const { hotelId, department, shift, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (hotelId) filter.hotelId = hotelId;
    if (department) filter.department = department;
    if (shift) filter.shift = shift;

    const skip = (Number(page) - 1) * Number(limit);
    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .populate("userId", "firstName lastName email phone role")
        .skip(skip)
        .limit(Number(limit)),
      Staff.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            staff,
            pagination: {
              total,
              page: Number(page),
              pages: Math.ceil(total / limit),
            },
          },
          "Staff fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single staff
// @route  GET /api/v1/staff/:id
export const getStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate("userId");
    if (!staff) throw new ApiError(404, "Staff not found");
    res.status(200).json(new ApiResponse(200, staff, "Staff fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Update staff
// @route  PATCH /api/v1/staff/:id
export const updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!staff) throw new ApiError(404, "Staff not found");
    res.status(200).json(new ApiResponse(200, staff, "Staff updated"));
  } catch (error) {
    next(error);
  }
};

// @desc   Remove staff (soft delete)
// @route  DELETE /api/v1/staff/:id
export const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!staff) throw new ApiError(404, "Staff not found");
    res.status(200).json(new ApiResponse(200, null, "Staff removed"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get staff by department (for scheduling)
// @route  GET /api/v1/staff/department/:dept
export const getStaffByDepartment = async (req, res, next) => {
  try {
    const staff = await Staff.find({
      department: req.params.dept,
      isActive: true,
    }).populate("userId", "firstName lastName");
    res.status(200).json(new ApiResponse(200, staff, "Staff fetched"));
  } catch (error) {
    next(error);
  }
};
