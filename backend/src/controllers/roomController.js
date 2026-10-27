// backend/src/controllers/roomController.js
import Room from "../models/Room.js";
import RoomType from "../models/RoomType.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToHotel, EVENTS } from "../config/socket.js";

// ═══════════════════════════════════════════════════════════════
// ROOM TYPES
// ═══════════════════════════════════════════════════════════════

export const createRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.create(req.body);
    res.status(201).json(new ApiResponse(201, roomType, "Room type created"));
  } catch (error) {
    next(error);
  }
};

export const getRoomTypes = async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const filter = { isActive: true };
    if (hotelId && hotelId.length === 24) filter.hotelId = hotelId;

    const roomTypes = await RoomType.find(filter).populate("amenities");
    res.status(200).json(new ApiResponse(200, roomTypes, "Room types fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!roomType) throw new ApiError(404, "Room type not found");
    res.status(200).json(new ApiResponse(200, roomType, "Room type updated"));
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════
// ROOMS
// ═══════════════════════════════════════════════════════════════

export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    await room.populate("roomTypeId");
    emitToHotel(room.hotelId, EVENTS.ROOM_STATUS_CHANGED, room);
    res.status(201).json(new ApiResponse(201, room, "Room created"));
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL ROOMS — Fixed version
 * Only filters by hotelId if it's a valid 24-character ObjectId string.
 * Otherwise returns all rooms.
 */
export const getAllRooms = async (req, res, next) => {
  try {
    const {
      hotelId,
      status,
      floor,
      roomTypeId,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = { isActive: true };

    // Only apply hotelId filter if it's a valid ObjectId string (24 hex chars)
    if (
      hotelId &&
      typeof hotelId === "string" &&
      hotelId.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(hotelId)
    ) {
      filter.hotelId = hotelId;
    }

    if (status) filter.status = { $in: String(status).split(",") };
    if (floor !== undefined && floor !== "") filter.floor = Number(floor);
    if (roomTypeId && roomTypeId.length === 24) filter.roomTypeId = roomTypeId;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate("roomTypeId", "name code basePrice maxOccupancy images")
        .populate("currentBookingId", "bookingNumber guestId checkIn checkOut")
        .skip(skip)
        .limit(limitNum)
        .sort({ roomNumber: 1 }),
      Room.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          rooms,
          pagination: {
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
          },
        },
        "Rooms fetched",
      ),
    );
  } catch (error) {
    console.error("getAllRooms error:", error);
    next(error);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate("roomTypeId");
    if (!room) throw new ApiError(404, "Room not found");
    res.status(200).json(new ApiResponse(200, room, "Room fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("roomTypeId");
    if (!room) throw new ApiError(404, "Room not found");

    emitToHotel(room.hotelId, EVENTS.ROOM_STATUS_CHANGED, room);
    res.status(200).json(new ApiResponse(200, room, "Room updated"));
  } catch (error) {
    next(error);
  }
};

export const changeRoomStatus = async (req, res, next) => {
  try {
    const { status, housekeepingStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (housekeepingStatus) update.housekeepingStatus = housekeepingStatus;
    if (housekeepingStatus === "clean") update.lastCleanedAt = new Date();

    const room = await Room.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!room) throw new ApiError(404, "Room not found");

    emitToHotel(room.hotelId, EVENTS.ROOM_STATUS_CHANGED, room);
    res.status(200).json(new ApiResponse(200, room, "Room status updated"));
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!room) throw new ApiError(404, "Room not found");
    res.status(200).json(new ApiResponse(200, null, "Room deleted"));
  } catch (error) {
    next(error);
  }
};
