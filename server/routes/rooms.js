const router = require("express").Router();
const Room = require("../models/Room");
const { verifyToken } = require("../middleware/auth");

// Get all rooms
router.get("/", verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find().populate("createdBy", "username");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create room
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const exists = await Room.findOne({ name });
    if (exists) return res.status(409).json({ message: "Room already exists" });

    const room = await Room.create({ name, description, createdBy: req.user.id });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;