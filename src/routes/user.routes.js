import { Router } from "express";
import {
  googleOAuth,
  isLoggedIn,
  loginuser,
  logout,
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
router.route("/isLoggedIn").get(verifyJwt, isLoggedIn);
router.route("/logout").post(logoutUser);

export default router;
