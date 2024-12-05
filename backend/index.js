import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import ImageKit from "imagekit";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";

// Set up constants
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure imagekit
const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Database connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

// ImageKit authentication endpoint
app.get("/api/upload", async (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
  } catch (err) {
    console.error("ImageKit authentication error:", err);
    res.status(500).send("Error authenticating with ImageKit");
  }
});

// Chat routes
app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    // Create a new chat
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    // Check if the userChats document exists
    const userChats = await UserChats.findOne({ userId });

    if (!userChats) {
      // If no existing userChats document, create a new one
      const newUserChats = new UserChats({
        userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
    } else {
      // If userChats document exists, push the new chat to the array
      await UserChats.updateOne(
        { userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
    }

    res.status(201).send(savedChat._id);
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).send("Error creating chat");
  }
});

// Fetch user chats
app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const userChats = await UserChats.findOne({ userId });

    if (userChats) {
      res.status(200).send(userChats.chats);
    } else {
      res.status(404).send("No chats found");
    }
  } catch (err) {
    console.error("Error fetching user chats:", err);
    res.status(500).send("Error fetching user chats");
  }
});

// Fetch a specific chat
app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { id } = req.params;

  try {
    const chat = await Chat.findOne({ _id: id, userId });

    if (chat) {
      res.status(200).send(chat);
    } else {
      res.status(404).send("Chat not found");
    }
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).send("Error fetching chat");
  }
});

// Update chat history
app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;
  const { id } = req.params;

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: id, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.error("Error adding conversation:", err);
    res.status(500).send("Error adding conversation");
  }
});

// Error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// Serve static assets for production
app.use(express.static(path.join(__dirname, "../client/dist")));

// Fallback to index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Start server
app.listen(port, () => {
  connect();
  console.log(`Server running on port ${port}`);
});
