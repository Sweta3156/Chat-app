const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const roomRoutes = require("./routes/rooms");
const { verifySocketToken } = require("./middleware/auth");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => res.json({ status: "Chat server running 🚀" }));

// Track online users: { userId -> socketId }
const onlineUsers = new Map();

// Socket.io
io.use(verifySocketToken);

io.on("connection", (socket) => {
  const userId = socket.user.id;
  const username = socket.user.username;

  onlineUsers.set(userId, socket.id);
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  console.log(`✅ ${username} connected`);

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.emit("joinedRoom", roomId);
  });

  // Leave a room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
  });

  // Send message
  socket.on("sendMessage", async ({ roomId, content }) => {
    try {
      const message = await Message.create({
        sender: userId,
        room: roomId,
        content,
      });

      const populated = await message.populate("sender", "username avatar");

      io.to(roomId).emit("newMessage", populated);
    } catch (err) {
      socket.emit("error", "Failed to send message");
    }
  });

  // Typing indicator
  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("userTyping", { userId, username, isTyping });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log(`❌ ${username} disconnected`);
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

