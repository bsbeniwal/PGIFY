const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const adminAuth = require('../middleware/adminMiddleware');

router.post('/submit', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name required (max 100 chars)'),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject required (max 200 chars)'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message required (max 1000 chars)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const contact = new Contact({
      name,
      email,
      subject,
      message,
      userId: userId
    });

    await contact.save();

    res.status(201).json({
      message: 'Thank you for your message. We will get back to you soon!',
      contact
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ 
      message: 'Error submitting contact form',
      error: error.message 
    });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/contacts', auth, adminAuth, async (req, res) => {
  try {
    const contacts = await Contact.find().populate('userId', 'name email');
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;