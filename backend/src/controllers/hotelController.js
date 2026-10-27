import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import RoomType from "../models/RoomType.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc   Create hotel
// @route  POST /api/v1/hotels
export const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json(new ApiResponse(201, hotel, "Hotel created"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get all hotels
// @route  GET /api/v1/hotels
export const getAllHotels = async (req, res, next) => {
  try {
    const { city, country, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (city) filter["address.city"] = { $regex: city, $options: "i" };
    if (country) filter["address.country"] = { $regex: country, $options: "i" };
    if (category) filter.category = category;

    const skip = (page - 1) * limit;
    const [hotels, total] = await Promise.all([
      Hotel.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Hotel.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          hotels,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
          },
        },
        "Hotels fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single hotel
// @route  GET /api/v1/hotels/:id
export const getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate("amenities");
    if (!hotel) throw new ApiError(404, "Hotel not found");
    res.status(200).json(new ApiResponse(200, hotel, "Hotel fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Update hotel
// @route  PATCH /api/v1/hotels/:id
export const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel) throw new ApiError(404, "Hotel not found");
    res.status(200).json(new ApiResponse(200, hotel, "Hotel updated"));
  } catch (error) {
    next(error);
  }
};

// @desc   Delete hotel (soft delete)
// @route  DELETE /api/v1/hotels/:id
export const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!hotel) throw new ApiError(404, "Hotel not found");
    res.status(200).json(new ApiResponse(200, null, "Hotel deleted"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get hotel stats
// @route  GET /api/v1/hotels/:id/stats
export const getHotelStats = async (req, res, next) => {
  try {
    const hotelId = req.params.id;
    const [totalRooms, totalRoomTypes, roomsByStatus] = await Promise.all([
      Room.countDocuments({ hotelId, isActive: true }),
      RoomType.countDocuments({ hotelId, isActive: true }),
      Room.aggregate([
        {
          $match: {
            hotelId: (
              await import("mongoose")
            ).Types.ObjectId.createFromHexString(hotelId),
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totalRooms, totalRoomTypes, roomsByStatus },
          "Hotel stats fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};
