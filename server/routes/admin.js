const express = require("express");
const { body, validationResult } = require("express-validator");
const Room = require("../models/Room");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Contact = require("../models/Contact");
const verifyToken = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ✅ create a rooms (Admin)
router.post("/addrooms", verifyToken, adminMiddleware, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Room name required (max 100 chars)'),
  body('type').trim().isLength({ min: 1, max: 50 }).withMessage('Room type required (max 50 chars)'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').trim().isLength({ max: 1000 }).withMessage('Description max 1000 chars'),
  body('mainImage').isURL().withMessage('Main image must be a valid URL'),
  body('additionalImages').optional().isArray({ max: 3 }).withMessage('Max 3 additional images')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    try {
        const newRoom = new Room({
            ...req.body,
            additionalImages: (req.body.additionalImages || []).filter(Boolean)
        });

        await newRoom.save();
        res.status(201).json({ message: "Room added successfully", room: newRoom });
    } catch (error) {
        console.error("❌ Error adding room:", error);
        res.status(500).json({ message: "Error adding room", error: error.message });
    }
});

// ✅ Update Room Details (Only for Admins)
router.put("/update/:roomId", verifyToken, adminMiddleware, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.roomId,
      req.body,
      { new: true }
    );

    if (!updatedRoom) {
        return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Internal Server Error", error });
  }
});

// DELETE Room Route with booking cleanup
router.delete("/delete/:roomId", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    // First, delete all reviews for bookings in this room
    const bookings = await Booking.find({ roomId: roomId });
    const bookingIds = bookings.map(b => b._id);
    await Review.deleteMany({ bookingId: { $in: bookingIds } });

    // Delete all bookings associated with this room
    await Booking.deleteMany({ roomId: roomId });

    // Then delete the room
    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ 
      message: "Room and associated bookings deleted successfully",
      deletedRoom
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Error deleting room", error });
  }
});

// Get all booked rooms
router.get("/booked-rooms", verifyToken, adminMiddleware, async (req, res) => {
  try {
      const bookedRooms = await Room.find({ available: false }); // Fetch rooms that are booked
      res.status(200).json(bookedRooms);
  } catch (error) {
      console.error("Error fetching booked rooms:", error);
      res.status(500).json({ message: "Failed to fetch booked rooms" });
  }
});
  //users data
  router.get('/usersdata', verifyToken, adminMiddleware, async (req, res) => {
    try {
      const users = await User.find({}, '_id name email role');
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to load users" });
    }
  });
  
  // Delete user with cascade delete of bookings, reviews, contacts
  router.delete("/user-delete/:userId", verifyToken, adminMiddleware, async (req, res) => {    
    try {
      const receivedUser = req.params.userId;
      const checkUser = await User.findById(receivedUser);
      
      if (!checkUser) {
        return res.status(400).json({ message: "User not found" });
      }

      // Cascade delete: bookings, reviews, contacts associated with user
      const userBookings = await Booking.find({ userId: receivedUser });
      const bookingIds = userBookings.map(b => b._id);
      
      await Review.deleteMany({ bookingId: { $in: bookingIds } });
      await Booking.deleteMany({ userId: receivedUser });
      await Contact.deleteMany({ userId: receivedUser });
      await User.findByIdAndDelete(receivedUser);
      
      res.json({ message: "User and associated data deleted successfully" });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ message: "Error deleting user", error: err.message });
    }
  });

module.exports = router;
