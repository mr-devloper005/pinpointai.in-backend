import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/dbConnect.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb().then(() => {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`app running on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
});
