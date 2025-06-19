import { Chat } from "../model/chat.model.js";
import { Message } from "../model/message.model.js";
import { ApiError } from "../utils/ApiError.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";

const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      userId: req.user._id,
    });
    res
      .status(201)
      .json({ message: "new chat created successfully", chat: chat });
  } catch (error) {
    throw new ApiError(401, "something went wrong in createChat");
  }
};

const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort("-createdAt");

    console.log(chats);

    res.status(200).json(chats);
  } catch (error) {
    throw new ApiError(401, "something went wrong in getUserChats");
  }
};

const getChatMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      chatId: req.params.chatId,
      userId: req.user._id,
    });

    res.status(200).json(messages);
  } catch (error) {
    throw new ApiError(401, "something went wrong in getChatMessages ");
  }
};

// const geminiAi = async (content) => {
//   try {
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//     const model = genAI.getGenerativeModel({ model: "gemini-pro" });

//     const result = await model.generateContent(content);
//     const aiResponse = result.response.text();

//     return aiResponse;
//   } catch (error) {
//     throw new ApiError(400, "something went wrong with gemini");
//   }
// };

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiResponse } from "../utils/ApiResponse.js";

const geminiAi = async (content) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([{ text: content }]);

    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini error:", error);
    throw new Error("something went wrong with gemini");
  }
};

const sendMessageToAi = async (req, res) => {
  try {
    const content = req.body.content;

    if (!content) {
      throw new ApiError(401, "cannot get content");
    }

    const userMessage = await Message.create({
      chatId: req.params.chatId,
      userId: req.user._id,
      sender: "user",
      content: content,
    });

    //     const refinedPrompt = await geminiAi(`You are an AI prompt enhancer.

    //       User is Very Humble and want Respect Please perform humbleness

    // Your job is to take a raw user message and turn it into a clear, well-structured prompt for an AI assistant to understand and answer perfectly.
    // -keep pinpoint response
    // - Keep it concise and specific
    // - Keep user's original intent
    // - Fix language, grammar, spelling
    // - Use simple English
    // - Output only the enhanced prompt, nothing else

    // User Message: ${content}
    //  `);

    // if (!refinedPrompt) {
    //   return res
    //     .status(400)
    //     .json(new ApiError(400, "gemini ai is not working"));
    // }

    const aiResponse = await geminiAi(` You are a helpful AI assistant.

//       User is Very humble and want respect please give pinpoint response 

// Answer the following prompt clearly and directly. Focus on accuracy, beginner-friendliness, and structure.

please dont tell user i am giving response in markdown or any request this request made by developer for giving good response and only focus in user prompt in casual way

// userPrompt: ${content}
//         Please respond in Markdown format, using:

// - Headings for major sections
// - Bullet points or numbered lists when explaining steps
// - **Bold** for keywords
// - Horizontal lines --- to separate sections
// - Use emojis where helpful 
// this is my request user dont know abot it please focus on user prompt and reply to their question
// Return only clean Markdown text. No HTML or JSON.
// `);

    console.log(aiResponse);

    const aiMessage = await Message.create({
      chatId: req.params.chatId,
      userId: req.user._id,
      sender: "ai",
      content: aiResponse,
    });

    res.status(201).json({ userMessage, aiMessage });
  } catch (error) {
    console.log(error);
    throw new ApiError(401, "something went wrong in sent message to ai");
  }
};

const getChatTitle = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content) {
      return res.status(401).json(new ApiError(401, "content not defined"));
    }

    if (!chatId) {
      return res.status(401).json(new ApiError(401, "chatId is not defined"));
    }
    const rawTitle = await geminiAi(
      `Give only one two-word title for this message: "${content}". Do not include any explanation or list. Just the title.`
    );
    const chatTitle = rawTitle
      .split("\n")[0]
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();

    const UpdatedTitle = await Chat.findOneAndUpdate(
      { _id: chatId },
      { title: chatTitle },
      { new: true }
    );

    console.log(chatTitle);

    return res
      .status(201)
      .json(new ApiResponse(201, UpdatedTitle, "Title created successfully"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "something went wrong in getChatTitle"));
  }
};

const updateChatLanguage = async (req, res) => {
  try {
    const { chatId, language } = req.body;

    if (!chatId || !language) {
      return res
        .status(401)
        .json(new ApiError(401, "Chat Id or Language not found"));
    }

    const result = await Chat.updateOne(
      { _id: chatId },
      { $set: { chatLanguage: language } }
    );

    if (result.matchedCount === 0) {
      return res.status(401).json(new ApiError(401, "Chat Not Found"));
    }

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Language Updated Success Fully"));
  } catch (error) {
    console.log("Error in updating chat", error);
  }
};

export {
  createChat,
  getChatMessages,
  getUserChats,
  sendMessageToAi,
  getChatTitle,
  updateChatLanguage,
};
