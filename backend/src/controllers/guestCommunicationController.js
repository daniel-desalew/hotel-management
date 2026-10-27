import GuestCommunication from "../models/GuestCommunication.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createGuestCommunication = async (req, res, next) => {
  try {
    const {
      hotelId,
      guestId,
      guestName,
      guestEmail,
      channel,
      subject,
      message,
      status,
    } = req.body;

    if (
      !hotelId ||
      !guestId ||
      !guestName ||
      !guestEmail ||
      !subject ||
      !message
    ) {
      throw new ApiError(
        400,
        "hotelId, guestId, guestName, guestEmail, subject, and message are required",
      );
    }

    const communication = await GuestCommunication.create({
      hotelId,
      guestId,
      guestName,
      guestEmail,
      channel: channel || "email",
      subject,
      message,
      status: status || "sent",
    });

    res
      .status(201)
      .json(new ApiResponse(201, communication, "Guest communication sent"));
  } catch (error) {
    next(error);
  }
};

export const getGuestCommunications = async (req, res, next) => {
  try {
    const { hotelId, guestId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (guestId) filter.guestId = guestId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [messages, total] = await Promise.all([
      GuestCommunication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GuestCommunication.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          messages,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
        "Guest communications fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};
