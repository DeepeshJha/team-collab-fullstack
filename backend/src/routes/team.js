const express = require('express');
const router = express.Router();

const teamController = require('../controllers/team');
const { requireAdmin, requireMemberOrAdmin } = require('../middlewares/authorize');

router.get('/getAllTeams',  requireMemberOrAdmin(), teamController.getAllTeams);
router.get('/getTeamById/:id', requireMemberOrAdmin(), teamController.getTeamById);
router.post('/createTeam', requireMemberOrAdmin(), teamController.createTeam);
router.put('/updateTeam/:id', requireAdmin(), teamController.updateTeam);
router.delete('/deleteTeam/:id', requireAdmin(), teamController.deleteTeam);

module.exports = router;