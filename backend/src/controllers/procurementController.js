import Procurement from "../models/Procurement.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createProcurementOrder = async (req, res, next) => {
  try {
    const {
      hotelId,
      vendor,
      category,
      items,
      taxRate,
      status,
      requiredBy,
      notes,
    } = req.body;

    if (!hotelId || !vendor || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(
        400,
        "hotelId, vendor, and at least one item are required",
      );
    }

    const order = await Procurement.create({
      hotelId,
      vendor,
      category: category || "general",
      status: status || "draft",
      requiredBy: requiredBy ? new Date(requiredBy) : undefined,
      taxRate: Number(taxRate || 0),
      items,
      notes: notes || "",
    });

    res
      .status(201)
      .json(new ApiResponse(201, order, "Procurement order created"));
  } catch (error) {
    next(error);
  }
};

export const getProcurementOrders = async (req, res, next) => {
  try {
    const {
      hotelId,
      vendor,
      category,
      status,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (vendor) filter.vendor = new RegExp(vendor, "i");
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Procurement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Procurement.countDocuments(filter),
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
        "Procurement orders fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateProcurementOrder = async (req, res, next) => {
  try {
    const order = await Procurement.findById(req.params.id);
    if (!order) throw new ApiError(404, "Procurement order not found");

    const allowedFields = [
      "vendor",
      "category",
      "status",
      "taxRate",
      "items",
      "requiredBy",
      "notes",
    ];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        order[field] =
          field === "requiredBy" ? new Date(req.body[field]) : req.body[field];
      }
    });

    await order.validate();
    await order.save();

    res
      .status(200)
      .json(new ApiResponse(200, order, "Procurement order updated"));
  } catch (error) {
    next(error);
  }
};

export const deleteProcurementOrder = async (req, res, next) => {
  try {
    const order = await Procurement.findByIdAndDelete(req.params.id);
    if (!order) throw new ApiError(404, "Procurement order not found");

    res
      .status(200)
      .json(new ApiResponse(200, null, "Procurement order deleted"));
  } catch (error) {
    next(error);
  }
};
