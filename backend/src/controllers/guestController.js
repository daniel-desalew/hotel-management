import Guest from "../models/Guest.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc   Create guest
// @route  POST /api/v1/guests
export const createGuest = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    // Check if guest already exists by email or phone
    const duplicateChecks = [];
    if (email?.trim()) duplicateChecks.push({ email: email.trim().toLowerCase() });
    if (phone?.trim()) duplicateChecks.push({ phone: phone.trim() });
    const existing = duplicateChecks.length
      ? await Guest.findOne({ $or: duplicateChecks })
      : null;
    if (existing) {
      return res
        .status(200)
        .json(new ApiResponse(200, existing, "Existing guest found"));
    }

    const guest = await Guest.create(req.body);
    res.status(201).json(new ApiResponse(201, guest, "Guest created"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get all guests
// @route  GET /api/v1/guests
export const getAllGuests = async (req, res, next) => {
  try {
    const { search, tier, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (tier) filter["loyalty.tier"] = tier;

    const skip = (Number(page) - 1) * Number(limit);
    const [guests, total] = await Promise.all([
      Guest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Guest.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            guests,
            pagination: {
              total,
              page: Number(page),
              pages: Math.ceil(total / limit),
            },
          },
          "Guests fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single guest
// @route  GET /api/v1/guests/:id
export const getGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) throw new ApiError(404, "Guest not found");
    res.status(200).json(new ApiResponse(200, guest, "Guest fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Update guest
// @route  PATCH /api/v1/guests/:id
export const updateGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!guest) throw new ApiError(404, "Guest not found");
    res.status(200).json(new ApiResponse(200, guest, "Guest updated"));
  } catch (error) {
    next(error);
  }
};

// @desc   Delete guest (soft delete via blacklist)
// @route  DELETE /api/v1/guests/:id
export const deleteGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      {
        isBlacklisted: true,
        blacklistReason: req.body.reason || "Deleted by admin",
      },
      { new: true },
    );
    if (!guest) throw new ApiError(404, "Guest not found");
    res.status(200).json(new ApiResponse(200, null, "Guest blacklisted"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get guest profile with booking history & stats
// @route  GET /api/v1/guests/:id/profile
export const getGuestProfile = async (req, res, next) => {
  try {
    const guestId = req.params.id;
    const [guest, recentBookings, stats] = await Promise.all([
      Guest.findById(guestId),
      Booking.find({ guestId })
        .sort({ checkIn: -1 })
        .limit(10)
        .populate("hotelId", "name"),
      Booking.aggregate([
        {
          $match: {
            guestId: (
              await import("mongoose")
            ).Types.ObjectId.createFromHexString(guestId),
          },
        },
        {
          $group: {
            _id: null,
            totalStays: {
              $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "checked_out"] },
                  "$pricing.totalAmount",
                  0,
                ],
              },
            },
            avgNights: { $avg: "$nights" },
          },
        },
      ]),
    ]);

    if (!guest) throw new ApiError(404, "Guest not found");

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { guest, recentBookings, stats: stats[0] || {} },
          "Guest profile fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Add loyalty points
// @route  POST /api/v1/guests/:id/loyalty
export const addLoyaltyPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { $inc: { "loyalty.points": points } },
      { new: true },
    );
    if (!guest) throw new ApiError(404, "Guest not found");
    res.status(200).json(new ApiResponse(200, guest, "Loyalty points updated"));
  } catch (error) {
    next(error);
  }
};
