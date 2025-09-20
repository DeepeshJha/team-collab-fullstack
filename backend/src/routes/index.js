const express = require('express');
const router = express.Router();

const { home } = require('../controllers');
router.get('/', home);

const userRoutes = require('./user');
router.use('/api/users', userRoutes);

const taskRoutes = require('./task');
router.use('/api/tasks', taskRoutes);

module.exports = router;