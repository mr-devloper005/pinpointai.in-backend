import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    await mongoose.connect(new URL(process.env.MONGODB_URI).toString());
    console.log("connected to data base succesfully");
  } catch (error) {
    new ApiError(404, "failed to connect database");
    console.log(error);
    process.exit(1);
  }
};

export default connectDb;
