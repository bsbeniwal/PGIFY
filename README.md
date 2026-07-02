# PGFIY - Hotel Management System

A full-stack hotel booking application built with React and Express.js, featuring secure authentication with OTP email verification, room management, payment processing, and admin controls.

## 🌟 Features

- **OTP Email Verification**: Secure registration with one-time passwords sent via Nodemailer
- **User Authentication**: JWT-based authentication with secure password hashing
- **Room Management**: Browse, filter, and book hotel rooms with availability tracking
- **Booking System**: Real-time booking with date-based conflict detection
- **Payment Processing**: Integrated Stripe for secure payment handling
- **Reviews & Ratings**: Users can rate and review rooms after booking
- **Admin Dashboard**: Manage rooms, users, bookings, and contact submissions
- **Rate Limiting**: Protection against brute-force attacks and DDoS
- **Input Validation**: Comprehensive validation on all API endpoints
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop

## 🏗️ Project Structure

```
pgfiy/
├── server/                    # Express.js backend
│   ├── models/               # MongoDB Mongoose models
│   ├── routes/               # API endpoints
│   ├── middleware/           # Authentication, rate limiting, OTP
│   ├── .env.example          # Environment template
│   └── server.js             # Server entry point
├── client/hotel-management/  # React frontend
│   ├── src/pages/            # React components
│   ├── src/utils/            # API client configuration
│   └── .env.example          # Frontend environment template
└── README.md
```

## 🔐 Authentication & Security

### OTP Email Verification with Nodemailer

The application uses **Nodemailer** to send OTP (One-Time Passwords) for email verification during registration:

1. **User Registration**: User enters email and receives a 6-digit OTP via email
2. **OTP Generation**: OTP is generated using `otp-generator` with 10-minute expiry
3. **Email Delivery**: Nodemailer (Gmail SMTP) delivers OTP to user's inbox
4. **Verification**: User submits OTP along with password to complete registration
5. **Security Features**:
   - Rate limiting: 5 OTP requests per 15 minutes per email
   - 10-minute expiration for OTP codes
   - OTP codes are automatically deleted after verification or expiry

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

### API Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **OTP Endpoint**: 5 requests per 15 minutes per email
- Protection against DDoS and brute-force attacks

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account (for Nodemailer)
- Stripe account

### Installation

1. **Clone the repository**
```bash
cd pgfiy
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Create server/.env file**
```env
# Server Configuration
PORT=9000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_atlas_uri

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Nodemailer)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Stripe Keys
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. **Setup Frontend**
```bash
cd client/hotel-management
npm install
```

5. **Create client/hotel-management/.env file**
```env
REACT_APP_API_URL=http://localhost:9000
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## 📦 Running the Application

### Start Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:9000
```

### Start Frontend Development Server
```bash
cd client/hotel-management
npm start
# Frontend runs on http://localhost:3001
```

## 🔑 Key Endpoints

### Authentication
- `POST /auth/send-otp` - Request OTP for email verification
- `POST /auth/verify-otp` - Verify OTP and complete registration
- `POST /auth/login` - User login with email and password

### Rooms
- `GET /rooms` - Get all available rooms
- `GET /rooms/:id` - Get room details with reviews
- `POST /rooms/update-availability` - Update room availability

### Bookings
- `GET /bookings/userbookings` - Get user's bookings
- `GET /bookings/:bookingId` - Get specific booking
- `POST /bookings/update-status` - Update booking status

### Payments
- `POST /payments/create-checkout-session` - Create Stripe session
- `POST /payments/confirm-booking` - Confirm booking after payment

### Reviews
- `GET /reviews/room/:roomId` - Get all reviews for a room
- `POST /reviews/add` - Add new review
- `PUT /reviews/edit/:reviewId` - Edit review
- `DELETE /reviews/delete/:reviewId` - Delete review

### Admin
- `POST /admin/addrooms` - Add new room
- `PUT /admin/update/:roomId` - Update room
- `DELETE /admin/delete/:roomId` - Delete room
- `GET /admin/usersdata` - Get all users

## 📧 Nodemailer Configuration

To enable email verification:

1. **Gmail Account Setup**:
   - Create a Gmail account or use existing one
   - Enable 2-factor authentication
   - Generate an [App Password](https://support.google.com/accounts/answer/185833)

2. **Environment Variables**:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

3. **OTP Flow**:
   - User requests OTP → Email sent via Nodemailer
   - User receives 6-digit code in inbox
   - User enters OTP → Account created after verification

## 🛠️ Tech Stack

**Frontend**:
- React 19
- React Router 7
- Tailwind CSS
- Axios

**Backend**:
- Express.js 4.21.2
- MongoDB & Mongoose 8.12.1
- JWT (jsonwebtoken) 9.0.2
- bcryptjs 3.0.2
- Nodemailer 6.x (Email delivery)
- Stripe 17.7.0 (Payment processing)
- express-rate-limit 7.1.5 (DDoS protection)
- express-validator 7.0.0 (Input validation)

## 📝 Database Models

- **User**: User accounts with email and hashed passwords
- **Room**: Hotel rooms with details and availability
- **Booking**: Room bookings with check-in/check-out dates
- **Payment**: Payment records from Stripe
- **Review**: Room reviews and ratings
- **Contact**: Contact form submissions
- **OTP**: Temporary OTP storage for email verification

## 🔒 Security Features

✅ Rate limiting on all endpoints
✅ Password hashing with bcryptjs
✅ JWT token authentication (1-hour expiry)
✅ Input validation with express-validator
✅ CORS protection
✅ OTP email verification with Nodemailer
✅ Cascade deletion for data integrity
✅ Date-based booking conflict detection
✅ Admin role-based access control

## 📄 License

This project is provided as-is for hotel management purposes.
