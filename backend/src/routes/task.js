const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task');
const { requireAdmin, requireMemberOrAdmin } = require('../middlewares/authorize');

router.get('/getAllTasks',  requireMemberOrAdmin(), taskController.getAllTasks);
router.get('/getTaskById/:id', requireMemberOrAdmin(), taskController.getTaskById);
router.post('/createTask', requireMemberOrAdmin(), taskController.createTask);
router.delete('/deleteTask/:id', requireAdmin(), taskController.deleteTask);

module.exports = router;