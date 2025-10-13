const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

// router.get('/getAllUsers', userController.getAllUsers);
// router.get('/getUserById/:id', userController.getUserById);
// router.post('/createUser', userController.createUser);
// router.put('/updateUser/:id', userController.updateUser);
// router.delete('/deleteUser/:id', userController.deleteUser);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;