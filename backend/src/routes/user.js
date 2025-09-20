const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUserById/:id', userController.getUserById);
router.post('/createUser', userController.createUser);
router.delete('/deleteUser/:id', userController.deleteUser);

module.exports = router;
