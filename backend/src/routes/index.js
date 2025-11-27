const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authenticate');

const { home } = require('../controllers');
router.get('/', home);

const authRoutes = require('./auth');
router.use('/auth', authRoutes);

// router.use(authenticateToken); // Protect routes below this line

const userRoutes = require('./user');
router.use('/users', authenticateToken, userRoutes);

const taskRoutes = require('./task');
router.use('/tasks', authenticateToken,taskRoutes);

module.exports = router;