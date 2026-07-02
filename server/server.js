const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();

const allowedOrigins = [
  "https://hotel-management-clientt-git-main-harishsingh-01s-projects.vercel.app",
  "https://hotel-management-clientt-neon.vercel.app",
  "https://hotel-management-clientt-harishsingh-01s-projects.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}));

// Global rate limiter for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(express.json());
app.use("/api/", limiter);

const roomRoutes = require("./routes/roomRoutes");
app.use("/api/rooms", roomRoutes);
  
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const paymentRoutes = require("./routes/paymentRoutes"); 
app.use("/api/payments", paymentRoutes); 

const AdminRoute = require("./routes/admin");
app.use("/api/admin", AdminRoute);

const reviewRoutes = require("./routes/reviews");
app.use("/api/reviews", reviewRoutes);

const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  
  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({ error: err.message });
  }
  
  // CORS errors
  if (err.message && err.message.includes("Not allowed by CORS")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
