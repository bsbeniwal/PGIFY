const express = require("express");
const { body, validationResult } = require("express-validator");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const router = express.Router();
const mongoose = require("mongoose");

const executeWithRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 112 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
      throw error;
    }
  }
};

router.post("/create-checkout-session", [
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('roomId').isMongoId().withMessage('Invalid room ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').isISO8601().withMessage('Invalid check-out date')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", errors: errors.array() });
  }

  try {
    const { price, roomId, userId, checkIn, checkOut } = req.body;

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: "Check-out date must be after check-in date" });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({ error: "Check-in date cannot be in the past" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: "Hotel Room Booking" },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://hotel-management-clientt-git-main-harishsingh-01s-projects.vercel.app/success?roomId=${roomId}&userId=${userId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${price}`,
    });
     
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/confirm-booking", [
  body('roomId').isMongoId().withMessage('Invalid room ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').isISO8601().withMessage('Invalid check-out date'),
  body('totalPrice').isFloat({ min: 0.01 }).withMessage('Invalid price')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", errors: errors.array() });
  }

  let session = null;

  try {
    const { roomId, userId, checkIn, checkOut, totalPrice } = req.body;

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: "Check-out date must be after check-in date" });
    }

    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      roomId,
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ],
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({ error: "Room is already booked for these dates" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const booking = new Booking({
      userId,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: 'booked'
    });

    await booking.save();

    // Mark room as unavailable
    room.available = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully!",
      bookingId: booking._id
    });

  } catch (error) {
    console.error("Booking Error:", error);

    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (sessionError) {
        console.error("Session abort error:", sessionError);
      }
    }

    if (error.code === 251) {
      return res.status(500).json({
        error: "Booking system temporarily unavailable. Please try again."
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: "This room is already booked for the selected dates"
      });
    }

    res.status(500).json({
      error: "Unable to complete booking. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (error) {
        console.error("Session end error:", error);
      }
    }
  }
});

module.exports = router;
