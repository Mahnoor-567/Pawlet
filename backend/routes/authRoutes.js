const express = require('express');
const router = express.Router();
const { register, sellerRegister, becomeSeller, setSellerType, login, updateProfile, getProfile, resetPassword } = require('../controllers/authController');
const { createShop } = require('../controllers/shopController');
const authMiddleware = require('../middleware/authMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// Register route
router.post('/register', register);

// Seller Register route
router.post('/seller/register', sellerRegister);

// Convert existing user to seller
router.post('/become-seller', authMiddleware, becomeSeller);
router.post('/set-seller-type', authMiddleware, setSellerType);

// Create shop (verified seller only) — legacy path, prefer POST /api/shops
router.post('/shop', authMiddleware, sellerMiddleware, createShop);

// Login route
router.post('/login', login);

// Reset password (simple academic flow)
router.post('/reset-password', resetPassword);

// Get profile - requires valid JWT token
router.get('/profile', authMiddleware, getProfile);

// Update profile - requires valid JWT token
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
