import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc   Create review
// @route  POST /api/v1/reviews
export const createReview = async (req, res, next) => {
  try {
    const { bookingId, hotelId } = req.body;

    // Verify booking
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status !== "checked_out")
      throw new ApiError(400, "You can only review after check-out");

    const existing = await Review.findOne({ bookingId });
    if (existing)
      throw new ApiError(400, "Review already submitted for this booking");

    const review = await Review.create({ ...req.body, isVerified: true });

    // Update hotel rating
    const stats = await Review.aggregate([
      { $match: { hotelId: review.hotelId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$ratings.overall" },
          count: { $sum: 1 },
        },
      },
    ]);
    if (stats.length) {
      await Hotel.findByIdAndUpdate(review.hotelId, {
        "rating.average": Math.round(stats[0].avg * 10) / 10,
        "rating.count": stats[0].count,
      });
    }

    res.status(201).json(new ApiResponse(201, review, "Review submitted"));
  } catch (error) {
    next(error);
  }
};

// @desc   Get reviews
// @route  GET /api/v1/reviews
export const getAllReviews = async (req, res, next) => {
  try {
    const { hotelId, minRating, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (hotelId) filter.hotelId = hotelId;
    if (minRating) filter["ratings.overall"] = { $gte: Number(minRating) };

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("guestId", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            reviews,
            pagination: {
              total,
              page: Number(page),
              pages: Math.ceil(total / limit),
            },
          },
          "Reviews fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get single review
// @route  GET /api/v1/reviews/:id
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate("guestId");
    if (!review) throw new ApiError(404, "Review not found");
    res.status(200).json(new ApiResponse(200, review, "Review fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Respond to review
// @route  POST /api/v1/reviews/:id/respond
export const respondToReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        response: {
          text: req.body.text,
          respondedBy: req.user._id,
          respondedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!review) throw new ApiError(404, "Review not found");
    res.status(200).json(new ApiResponse(200, review, "Response added"));
  } catch (error) {
    next(error);
  }
};

// @desc   Delete review
// @route  DELETE /api/v1/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true },
    );
    if (!review) throw new ApiError(404, "Review not found");
    res.status(200).json(new ApiResponse(200, null, "Review deleted"));
  } catch (error) {
    next(error);
  }
};
