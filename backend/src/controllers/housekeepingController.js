import Housekeeping from "../models/Housekeeping.js";
import Room from "../models/Room.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToHotel, emitToUser, EVENTS } from "../config/socket.js";
import { sendNotification } from "./notificationController.js";

// @desc   Create housekeeping task
// @route  POST /api/v1/housekeeping
export const createTask = async (req, res, next) => {
  try {
    const task = await Housekeeping.create(req.body);
    await task.populate("roomId", "roomNumber floor");
    await task.populate("assignedTo", "firstName lastName");

    if (task.assignedTo) {
      emitToUser(task.assignedTo._id, EVENTS.HOUSEKEEPING_ASSIGNED, task);
      await sendNotification({
        userId: task.assignedTo._id,
        hotelId: task.hotelId,
        type: "housekeeping_task",
        title: "Housekeeping task assigned",
        message: `A task was assigned for room ${task.roomId?.roomNumber || ""}.`,
        data: { taskId: task._id, roomId: task.roomId?._id },
      });
    }
    emitToHotel(task.hotelId, EVENTS.HOUSEKEEPING_ASSIGNED, task);

    res.status(201).json(new ApiResponse(201, task, "Task created"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get all tasks
// @route  GET /api/v1/housekeeping
export const getAllTasks = async (req, res, next) => {
  try {
    const {
      hotelId,
      status,
      priority,
      assignedTo,
      page = 1,
      limit = 50,
    } = req.query;
    const filter = {};
    if (hotelId) filter.hotelId = hotelId;
    if (status) filter.status = { $in: status.split(",") };
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Housekeeping.find(filter)
        .populate("roomId", "roomNumber floor")
        .populate("assignedTo", "firstName lastName")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Housekeeping.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            tasks,
            pagination: {
              total,
              page: Number(page),
              pages: Math.ceil(total / limit),
            },
          },
          "Tasks fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single task
// @route  GET /api/v1/housekeeping/:id
export const getTask = async (req, res, next) => {
  try {
    const task = await Housekeeping.findById(req.params.id)
      .populate("roomId")
      .populate("assignedTo");
    if (!task) throw new ApiError(404, "Task not found");
    res.status(200).json(new ApiResponse(200, task, "Task fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Update task
// @route  PATCH /api/v1/housekeeping/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Housekeeping.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!task) throw new ApiError(404, "Task not found");
    emitToHotel(task.hotelId, EVENTS.HOUSEKEEPING_COMPLETED, task);
    res.status(200).json(new ApiResponse(200, task, "Task updated"));
  } catch (error) {
    next(error);
  }
};

// @desc   Assign task to staff
// @route  POST /api/v1/housekeeping/:id/assign
export const assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const task = await Housekeeping.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: "in_progress", startedAt: new Date() },
      { new: true },
    );
    if (!task) throw new ApiError(404, "Task not found");

    emitToUser(assignedTo, EVENTS.HOUSEKEEPING_ASSIGNED, task);
    await sendNotification({
      userId: assignedTo,
      hotelId: task.hotelId,
      type: "housekeeping_task",
      title: "Housekeeping task assigned",
      message: "A new housekeeping task was assigned to you.",
      data: { taskId: task._id, roomId: task.roomId },
    });
    res.status(200).json(new ApiResponse(200, task, "Task assigned"));
  } catch (error) {
    next(error);
  }
};

// @desc   Complete task
// @route  POST /api/v1/housekeeping/:id/complete
export const completeTask = async (req, res, next) => {
  try {
    const task = await Housekeeping.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    const timeSpent = task.startedAt
      ? Math.round((Date.now() - task.startedAt.getTime()) / 60000)
      : null;

    task.status = "completed";
    task.completedAt = new Date();
    task.timeSpent = timeSpent;
    task.checklist = req.body.checklist || task.checklist;
    task.notes = req.body.notes || task.notes;
    await task.save();

    // Update room status
    await Room.findByIdAndUpdate(task.roomId, {
      housekeepingStatus: "clean",
      status: "available",
      lastCleanedAt: new Date(),
    });

    emitToHotel(task.hotelId, EVENTS.HOUSEKEEPING_COMPLETED, task);
    emitToHotel(task.hotelId, EVENTS.ROOM_CLEANED, { roomId: task.roomId });

    res.status(200).json(new ApiResponse(200, task, "Task completed"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get tasks for a specific staff member
// @route  GET /api/v1/housekeeping/my-tasks
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Housekeeping.find({
      assignedTo: req.user._id,
      status: { $in: ["pending", "in_progress"] },
    })
      .populate("roomId", "roomNumber floor")
      .sort({ priority: -1 });
    res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched"));
  } catch (error) {
    next(error);
  }
};
