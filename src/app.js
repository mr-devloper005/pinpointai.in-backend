import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN,
//     Credential: true,
//   })
// );

app.use(
  cors({
    origin: "https://pinpointai.vercel.app",
    credentials: true,
  })
);

import router from "./routes/user.routes.js";

app.use("/api/auth", router);

import routerTwo from "./routes/chat.routes.js";

app.use("/api", routerTwo);

export default app;
