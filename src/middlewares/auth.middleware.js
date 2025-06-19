import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

const verifyJwt = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log(token);

    if (!token) {
      throw new ApiError(400, "token not found");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(400, "invalid token");
    }
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired token");
  }
};

export default verifyJwt;
