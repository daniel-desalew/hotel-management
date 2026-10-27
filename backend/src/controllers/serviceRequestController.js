import mongoose from "mongoose";
import ServiceRequest from "../models/ServiceRequest.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const createServiceRequest = async (req, res, next) => {
  try {
    const { hotelId, guestName, requestType, title, description, priority } =
      req.body;

    if (!hotelId || !title || !description) {
      throw new ApiError(400, "hotelId, title and description are required");
    }

    const request = await ServiceRequest.create({
      ...req.body,
      requestedBy: req.user?._id || null,
      status: "open",
    });

    await request.populate("assignedTo", "firstName lastName email");
    await request.populate("requestedBy", "firstName lastName email");

    res
      .status(201)
      .json(new ApiResponse(201, request, "Service request created"));
  } catch (error) {
    next(error);
  }
};

export const getAllServiceRequests = async (req, res, next) => {
  try {
    const {
      hotelId,
      status,
      priority,
      requestType,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = new mongoose.Types.ObjectId(hotelId);
    if (status) filter.status = { $in: String(status).split(",") };
    if (priority) filter.priority = priority;
    if (requestType) filter.requestType = requestType;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate("assignedTo", "firstName lastName email")
        .populate("requestedBy", "firstName lastName email")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceRequest.countDocuments(filter),
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
        "Service requests fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate("assignedTo", "firstName lastName email")
      .populate("requestedBy", "firstName lastName email");

    if (!request) throw new ApiError(404, "Service request not found");

    res
      .status(200)
      .json(new ApiResponse(200, request, "Service request fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!request) throw new ApiError(404, "Service request not found");

    res
      .status(200)
      .json(new ApiResponse(200, request, "Service request updated"));
  } catch (error) {
    next(error);
  }
};

export const assignServiceRequest = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: "assigned" },
      { new: true },
    );

    if (!request) throw new ApiError(404, "Service request not found");

    res
      .status(200)
      .json(new ApiResponse(200, request, "Service request assigned"));
  } catch (error) {
    next(error);
  }
};

export const completeServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, "Service request not found");

    request.status = "completed";
    request.notes = req.body.notes || request.notes;
    await request.save();

    res
      .status(200)
      .json(new ApiResponse(200, request, "Service request completed"));
  } catch (error) {
    next(error);
  }
};
