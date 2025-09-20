const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task');

router.get('/getAllTasks', taskController.getAllTasks);
router.get('/getTaskById/:id', taskController.getTaskById);
router.post('/createTask', taskController.createTask);
router.delete('/deleteTask/:id', taskController.deleteTask);

module.exports = router;