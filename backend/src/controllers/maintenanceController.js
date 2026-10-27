import mongoose from "mongoose";
import MaintenanceRequest from "../models/MaintenanceRequest.js";
import Room from "../models/Room.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { emitToHotel, EVENTS } from "../config/socket.js";
import { sendNotificationToHotel } from "./notificationController.js";

export const createRequest = async (req, res, next) => {
  try {
    const { hotelId, roomId, title, description, category, priority } =
      req.body;

    if (!hotelId || !title || !description) {
      throw new ApiError(400, "hotelId, title and description are required");
    }

    const request = await MaintenanceRequest.create({
      ...req.body,
      reportedBy: req.user?._id || null,
      status: "open",
    });

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { status: "maintenance" });
    }

    await request.populate("roomId", "roomNumber floor status");
    await request.populate("reportedBy", "firstName lastName email");
    await request.populate("assignedTo", "firstName lastName email");

    emitToHotel(hotelId, EVENTS.MAINTENANCE_CREATED, request);
    await sendNotificationToHotel({
      hotelId,
      type: "maintenance_ticket",
      title: "Maintenance request created",
      message: request.title,
      data: { requestId: request._id, roomId: request.roomId?._id || request.roomId },
      priority: priority || "normal",
    });

    res
      .status(201)
      .json(new ApiResponse(201, request, "Maintenance request created"));
  } catch (error) {
    next(error);
  }
};

export const getAllRequests = async (req, res, next) => {
  try {
    const {
      hotelId,
      status,
      priority,
      category,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = new mongoose.Types.ObjectId(hotelId);
    if (status) filter.status = { $in: String(status).split(",") };
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate("roomId", "roomNumber floor status")
        .populate("reportedBy", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MaintenanceRequest.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          requests,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Maintenance requests fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("roomId", "roomNumber floor status")
      .populate("reportedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!request) throw new ApiError(404, "Maintenance request not found");

    res
      .status(200)
      .json(new ApiResponse(200, request, "Maintenance request fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!request) throw new ApiError(404, "Maintenance request not found");

    if (req.body.status === "resolved" || req.body.status === "closed") {
      await Room.findByIdAndUpdate(request.roomId, {
        status: "available",
        housekeepingStatus: "dirty",
      });
    }

    res
      .status(200)
      .json(new ApiResponse(200, request, "Maintenance request updated"));
  } catch (error) {
    next(error);
  }
};

export const assignRequest = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: "assigned", startedAt: new Date() },
      { new: true },
    );

    if (!request) throw new ApiError(404, "Maintenance request not found");

    res
      .status(200)
      .json(new ApiResponse(200, request, "Maintenance request assigned"));
  } catch (error) {
    next(error);
  }
};

export const resolveRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, "Maintenance request not found");

    request.status = "resolved";
    request.resolvedAt = new Date();
    request.notes = req.body.notes || request.notes;
    await request.save();

    if (request.roomId) {
      await Room.findByIdAndUpdate(request.roomId, {
        status: "available",
        housekeepingStatus: "dirty",
      });
    }

    res
      .status(200)
      .json(new ApiResponse(200, request, "Maintenance request resolved"));
  } catch (error) {
    next(error);
  }
};
