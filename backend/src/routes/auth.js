const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth');

// Public routes: No authentication required
router.post('/register', register); // User registration route
router.post('/login', login);       // User login route

module.exports = router;