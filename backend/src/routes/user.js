const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');
const { requireAdmin, requireMemberOrAdmin } = require('../middlewares/authorize');
// router.get('/getAllUsers', userController.getAllUsers);
// router.get('/getUserById/:id', userController.getUserById);
// router.post('/createUser', userController.createUser);
// router.put('/updateUser/:id', userController.updateUser);
// router.delete('/deleteUser/:id', userController.deleteUser);

router.get('/',  requireMemberOrAdmin(), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', requireAdmin(), userController.createUser);
router.put('/:id', requireMemberOrAdmin(), userController.updateUser);
router.delete('/:id', requireAdmin(), userController.deleteUser);

module.exports = router;