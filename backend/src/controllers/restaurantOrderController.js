import RestaurantOrder from "../models/RestaurantOrder.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createRestaurantOrder = async (req, res, next) => {
  try {
    const {
      hotelId,
      guestName,
      tableNumber,
      items,
      taxRate,
      status,
      paymentStatus,
    } = req.body;

    if (!hotelId || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(
        400,
        "hotelId and at least one order item are required",
      );
    }

    const order = await RestaurantOrder.create({
      hotelId,
      guestName: guestName || "Walk-in Guest",
      tableNumber: tableNumber || "",
      items,
      taxRate: Number(taxRate || 0),
      status: status || "pending",
      paymentStatus: paymentStatus || "unpaid",
    });

    res
      .status(201)
      .json(new ApiResponse(201, order, "Restaurant order created"));
  } catch (error) {
    next(error);
  }
};

export const getRestaurantOrders = async (req, res, next) => {
  try {
    const { hotelId, tableNumber, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (tableNumber) filter.tableNumber = tableNumber;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      RestaurantOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RestaurantOrder.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Restaurant orders fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantOrder = async (req, res, next) => {
  try {
    const order = await RestaurantOrder.findById(req.params.id);
    if (!order) throw new ApiError(404, "Restaurant order not found");

    const allowed = [
      "guestName",
      "tableNumber",
      "items",
      "taxRate",
      "status",
      "paymentStatus",
    ];
    allowed.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        order[field] = req.body[field];
      }
    });

    await order.validate();
    await order.save();

    res
      .status(200)
      .json(new ApiResponse(200, order, "Restaurant order updated"));
  } catch (error) {
    next(error);
  }
};

export const deleteRestaurantOrder = async (req, res, next) => {
  try {
    const order = await RestaurantOrder.findByIdAndDelete(req.params.id);
    if (!order) throw new ApiError(404, "Restaurant order not found");

    res
      .status(200)
      .json(new ApiResponse(200, null, "Restaurant order deleted"));
  } catch (error) {
    next(error);
  }
};
