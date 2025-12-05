const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Public routes: No authentication required
router.post('/register', authController.register); // User registration route
router.post('/login', authController.login);       // User login route
router.post('/forgot-password', authController.forgotPassword); // Forgot password route
router.post('/reset-password', authController.resetPassword);   // Reset password route
router.get('/verify-email/:token', authController.verifyEmail); // Email verification route

module.exports = router;