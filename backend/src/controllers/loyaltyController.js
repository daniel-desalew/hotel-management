import LoyaltyProgram from "../models/LoyaltyProgram.js";
import LoyaltyRedemption from "../models/LoyaltyRedemption.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createLoyaltyMember = async (req, res, next) => {
  try {
    const {
      hotelId,
      guestName,
      guestEmail,
      phone,
      totalPoints,
      status,
      notes,
    } = req.body;

    if (!hotelId || !guestName || !guestEmail) {
      throw new ApiError(
        400,
        "hotelId, guestName, and guestEmail are required",
      );
    }

    const member = await LoyaltyProgram.create({
      hotelId,
      guestName,
      guestEmail,
      phone: phone || "",
      totalPoints: Number(totalPoints || 0),
      status: status || "active",
      notes: notes || "",
    });

    res
      .status(201)
      .json(new ApiResponse(201, member, "Loyalty member created"));
  } catch (error) {
    next(error);
  }
};

export const getLoyaltyMembers = async (req, res, next) => {
  try {
    const { hotelId, tier, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (tier) filter.tier = tier;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [members, total] = await Promise.all([
      LoyaltyProgram.find(filter)
        .sort({ totalPoints: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoyaltyProgram.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          members,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Loyalty members fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateLoyaltyMember = async (req, res, next) => {
  try {
    const member = await LoyaltyProgram.findById(req.params.id);
    if (!member) throw new ApiError(404, "Loyalty member not found");

    const allowedFields = [
      "guestName",
      "guestEmail",
      "phone",
      "totalPoints",
      "status",
      "notes",
    ];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        member[field] = req.body[field];
      }
    });

    await member.validate();
    await member.save();

    res
      .status(200)
      .json(new ApiResponse(200, member, "Loyalty member updated"));
  } catch (error) {
    next(error);
  }
};

export const deleteLoyaltyMember = async (req, res, next) => {
  try {
    const member = await LoyaltyProgram.findByIdAndDelete(req.params.id);
    if (!member) throw new ApiError(404, "Loyalty member not found");

    res.status(200).json(new ApiResponse(200, null, "Loyalty member deleted"));
  } catch (error) {
    next(error);
  }
};

export const createLoyaltyRedemption = async (req, res, next) => {
  try {
    const { memberId, hotelId, rewardType, redeemedPoints, note, status } =
      req.body;

    if (!memberId || !hotelId) {
      throw new ApiError(400, "memberId and hotelId are required");
    }

    const points = Number(redeemedPoints || 0);
    if (!Number.isFinite(points) || points <= 0) {
      throw new ApiError(400, "redeemedPoints must be greater than 0");
    }

    const member = await LoyaltyProgram.findById(memberId);
    if (!member) {
      throw new ApiError(404, "Loyalty member not found");
    }

    if (member.hotelId.toString() !== hotelId.toString()) {
      throw new ApiError(400, "Member does not belong to this hotel");
    }

    if (member.pointsBalance < points) {
      throw new ApiError(400, "Insufficient loyalty points for redemption");
    }

    member.pointsBalance = Number(member.pointsBalance) - points;
    member.totalPoints = Number(member.totalPoints || 0);
    await member.save();

    const redemption = await LoyaltyRedemption.create({
      hotelId,
      memberId,
      guestName: member.guestName,
      guestEmail: member.guestEmail,
      rewardType: rewardType || "discount",
      redeemedPoints: points,
      status: status || "approved",
      note: note || "",
    });

    res
      .status(201)
      .json(new ApiResponse(201, redemption, "Loyalty redemption created"));
  } catch (error) {
    next(error);
  }
};

export const getLoyaltyRedemptions = async (req, res, next) => {
  try {
    const { hotelId, memberId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (memberId) filter.memberId = memberId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [redemptions, total] = await Promise.all([
      LoyaltyRedemption.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoyaltyRedemption.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          redemptions,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Loyalty redemptions fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};
