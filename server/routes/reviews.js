const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Room = require('../models/Room');

const updateRoomRatings = async (roomId) => {
  try {
    const reviews = await Review.find({ roomId });
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

    await Room.findByIdAndUpdate(roomId, {
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating room ratings:', error);
  }
};

router.post('/add', auth, [
  body('bookingId').isMongoId(),
  body('roomId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').trim().isLength({ min: 1, max: 500 }).withMessage('Review must be 1-500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  try {
    const { bookingId, roomId, rating, review } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    const newReview = new Review({
      bookingId,
      userId: userId,
      roomId,
      rating: Number(rating),
      review: review.trim()
    });

    await newReview.save();
    await updateRoomRatings(roomId);
    
    const populatedReview = await Review.findById(newReview._id)
      .populate('roomId', 'name')
      .populate('userId', 'name');

    res.status(201).json({
      message: 'Review submitted successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ 
      message: 'Error creating review', 
      error: error.message
    });
  }
});

router.get('/room/:roomId', async (req, res) => {
  try {
    const reviews = await Review.find({ roomId: req.params.roomId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

router.get('/booking/:bookingId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ 
      bookingId: req.params.bookingId 
    }).populate('roomId', 'name');
    if (!review) {
      return res.status(200).json(null);
    }
    
    res.json(review);
  } catch (error) {
    console.error('Review fetch error:', error);
    res.status(500).json({ message: 'Error fetching review', error: error.message });
  }
});

router.put('/edit/:reviewId', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const updatedReview = await Review.findOneAndUpdate(
      { _id: req.params.reviewId, userId: req.user.id },
      { rating, review },
      { new: true }
    );
    
    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }
    
    await updateRoomRatings(updatedReview.roomId);
    
    res.json(updatedReview);
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
});

router.delete('/delete/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.reviewId,
      userId: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const roomId = review.roomId;
    await Review.deleteOne({ _id: req.params.reviewId });
    await updateRoomRatings(roomId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

module.exports = router;