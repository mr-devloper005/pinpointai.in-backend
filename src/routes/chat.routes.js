import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  createChat,
  getChatMessages,
  getChatTitle,
  getUserChats,
  sendMessageToAi,
  updateChatLanguage,
} from "../controllers/chat.controller.js";

const routerTwo = express.Router();

routerTwo.get("/chat/create", verifyJwt, createChat);
routerTwo.post("/chat/ai/:chatId", verifyJwt, sendMessageToAi);
routerTwo.get("/chat/getUserChats", verifyJwt, getUserChats);
routerTwo.get("/chat/getChatMessages/:chatId", verifyJwt, getChatMessages);
routerTwo.post("/chat/getChatTitle", verifyJwt, getChatTitle);
routerTwo.put("/chat/updateLanguage", verifyJwt, updateChatLanguage);
export default routerTwo;
