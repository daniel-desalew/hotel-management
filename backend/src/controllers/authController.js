import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc   Register new user
// @route  POST /api/v1/auth/register
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, "Email already registered");

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: role || "guest",
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push({ token: refreshToken });
    await user.save({ validateBeforeSave: false });

    const userResponse = await User.findById(user._id).select(
      "-password -refreshTokens",
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: userResponse, accessToken, refreshToken },
          "Registration successful",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Login user
// @route  POST /api/v1/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid email or password");

    if (!user.isActive) throw new ApiError(403, "Account is disabled");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.lastLogin = new Date();
    user.refreshTokens.push({ token: refreshToken });
    await user.save({ validateBeforeSave: false });

    const userResponse = await User.findById(user._id).select(
      "-password -refreshTokens",
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: userResponse, accessToken, refreshToken },
          "Login successful",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// @desc   Get current user
// @route  GET /api/v1/auth/me
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched"));
  } catch (error) {
    next(error);
  }
};

// @desc   Logout
// @route  POST /api/v1/auth/logout
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

// @desc   Update current user profile
// @route  PATCH /api/v1/auth/me
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "avatar",
      "preferences",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (!Object.keys(updates).length) {
      throw new ApiError(400, "No valid profile fields were provided");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens");

    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json(new ApiResponse(200, user, "Profile updated"));
  } catch (error) {
    next(error);
  }
};

// @desc   Change current user password
// @route  POST /api/v1/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current and new password are required");
    }

    if (newPassword.length < 8) {
      throw new ApiError(
        400,
        "New password must be at least 8 characters long",
      );
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
};

// @desc   Refresh access token
// @route  POST /api/v1/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(401, "Refresh token required");

    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    const tokenExists = user.refreshTokens.some(
      (t) => t.token === refreshToken,
    );
    if (!tokenExists) throw new ApiError(401, "Refresh token revoked");

    const accessToken = user.generateAccessToken();
    res
      .status(200)
      .json(new ApiResponse(200, { accessToken }, "Token refreshed"));
  } catch (error) {
    next(new ApiError(401, "Invalid refresh token"));
  }
};
