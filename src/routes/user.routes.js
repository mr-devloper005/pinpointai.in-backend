import { Router } from "express";
import {
  googleOAuth,
  loginuser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/googleauth").post(googleOAuth);
router.route("/registeruser").post(registerUser);
router.route("/loginuser").post(loginuser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/logout-user").post(verifyJwt, logoutUser);

export default router;
