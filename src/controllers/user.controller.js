import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import jwt, { decode } from "jsonwebtoken";
import bcrypt, { hash } from "bcryptjs";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { OAuth2Client } from "google-auth-library";

// const options = {
//   httpOnly: true,
//   secure: true,
// };

// res.cookie("token", token, {
//   httpOnly: true,
//   secure: true, // ✅ MUST for SameSite: 'None'
//   sameSite: "None",
// });

// const options = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "None",
//   maxAge: 360000000,
// };
const options = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
  maxAge: 360000000,
};

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(400, "user not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: true });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      400,
      "something went wrong while generating refreshtoken"
    );
  }
};

const googleOAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    console.log(token);

    if (!token) {
      throw new ApiError(400, "google token is required");
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name } = payload;

    if (!email || !name) {
      throw new ApiError(
        400,
        "Google account is missing essential information"
      );
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
      });
    }

    const accessToken = user.generateAccessToken();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 360000000,
    });

    res
      .status(201)
      .json(new ApiResponse(201, user, "User logged in SuccessFully"));
  } catch (error) {
    return next(error);
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log(req.body);

    if (!name || !email || !password) {
      throw new ApiError(401, "please provide all user details");
    }

    const existedUserCheck = await User.findOne({ email });

    if (existedUserCheck) {
      return res.status(409).json(new ApiResponse(409, "user already exist"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save();

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(201, "User created successfully", user, true));
  } catch (error) {
    console.error("Register Error:", error.message);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          error.message || "Internal Server Error",
          null,
          false
        )
      );
  }
};

const loginuser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(req.body);

    if (!email || !password) {
      return res
        .status(401)
        .json(new ApiResponse(401, "All filed is required"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json(new ApiError(401, "User not found"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(402, "password is incorrect");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    console.log(accessToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "user logged in succesfully"
        )
      );
  } catch (error) {
    console.log(error);
    return res.status(404).json(new ApiError(404, "something went wrong"));
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(400, "unauthorize request ");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.Refresh_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "invalid token ");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(400, "refresh token expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({ accessToken: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.log(error);
    throw new ApiError(
      401,
      "Something went wrong while refreshing access token"
    );
  }
};

const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken")
      .json(new ApiResponse(201, "user logout successfully"));
  } catch (error) {}
};

const isLoggedIn = async (req, res) => {
  console.log("checking the login thunk");

  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(401).json(new ApiError(401, "user Not loggedin", error));
  }
};

const logout = async (req, res) => {
  try {
    res
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .status(200)
      .json({
        success: true,
        message: "User logged out successfully",
      });
  } catch (error) {
    res.status(401).json(new ApiError(401, "something went wrong in logout"));
  }
};

export {
  googleOAuth,
  registerUser,
  loginuser,
  refreshAccessToken,
  logoutUser,
  isLoggedIn,
  logout,
};
