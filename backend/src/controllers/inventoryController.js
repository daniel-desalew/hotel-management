import mongoose from "mongoose";
import InventoryItem from "../models/InventoryItem.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const createInventoryItem = async (req, res, next) => {
  try {
    const { hotelId, name, category, stock, reorderLevel, unit } = req.body;

    if (!hotelId || !name) {
      throw new ApiError(400, "hotelId and name are required");
    }

    const item = await InventoryItem.create({
      ...req.body,
      status:
        Number(stock) <= Number(reorderLevel || 0) ? "low_stock" : "in_stock",
    });

    res.status(201).json(new ApiResponse(201, item, "Inventory item created"));
  } catch (error) {
    next(error);
  }
};

export const getAllInventoryItems = async (req, res, next) => {
  try {
    const { hotelId, category, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = new mongoose.Types.ObjectId(hotelId);
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ stock: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InventoryItem.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          items,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Inventory items fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) throw new ApiError(404, "Inventory item not found");

    res.status(200).json(new ApiResponse(200, item, "Inventory item fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!item) throw new ApiError(404, "Inventory item not found");

    const nextStatus =
      item.stock <= item.reorderLevel ? "low_stock" : "in_stock";
    item.status = nextStatus;
    await item.save();

    res.status(200).json(new ApiResponse(200, item, "Inventory item updated"));
  } catch (error) {
    next(error);
  }
};

export const adjustInventoryStock = async (req, res, next) => {
  try {
    const { delta } = req.body;
    const item = await InventoryItem.findById(req.params.id);
    if (!item) throw new ApiError(404, "Inventory item not found");

    item.stock = Math.max(0, Number(item.stock) + Number(delta));
    item.status = item.stock <= item.reorderLevel ? "low_stock" : "in_stock";
    await item.save();

    res
      .status(200)
      .json(new ApiResponse(200, item, "Inventory stock adjusted"));
  } catch (error) {
    next(error);
  }
};
