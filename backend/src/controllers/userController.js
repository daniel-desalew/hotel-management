// backend/src/controllers/userController.js
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, hotelId, search, page = 1, limit = 100 } = req.query;
    const filter = { isActive: true };

    if (role) filter.role = role;
    if (hotelId) filter.hotelId = hotelId;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
          },
        },
        'Users fetched'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');
    if (!user) throw new ApiError(404, 'User not found');
    res.status(200).json(new ApiResponse(200, user, 'User fetched'));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { password, refreshTokens, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -refreshTokens');

    if (!user) throw new ApiError(404, 'User not found');
    res.status(200).json(new ApiResponse(200, user, 'User updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) throw new ApiError(404, 'User not found');
    res.status(200).json(new ApiResponse(200, null, 'User deactivated'));
  } catch (error) {
    next(error);
  }
};
