const { team } = require('../models');

const { sanitizeInput } = require('../utils/helpers');

const ALLOWED_CREATE_FIELDS = [
    'name',
    'description',
    'descriptionRich',
    'isPrivate',
    'visibility',
    'department',
    'tags',
    'icon',
    'color'
];

const ALLOWED_UPDATE_FIELDS = [
    'name',
    'description',
    'descriptionRich',
    'isPrivate',
    'visibility',
    'department',
    'tags',
    'icon',
    'color',
    'settings'
];

// Controller function to get all teams
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await team.findAll(); // Fetch all teams from the database
        res.json(teams);                    // Send the list of teams as JSON response
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

// Controller function to get a team by ID
exports.getTeamById = async (req, res) => {
    const teamId = req.params.id;
    try {
        const teamData = await team.findByPk(teamId); // Find team by primary key (ID)
        if (teamData) {
            res.json(teamData); // Send team data as JSON response
        } else {
            res.status(404).json({ error: `Team with id ${teamId} not found` });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
}

exports.createTeam = async (req, res) => {
    // const { name, description } = req.body;
    try {
        const newTeam = await team.createTeam({ ...sanitizeInput(req.body, ALLOWED_CREATE_FIELDS), createdBy: req.user.id }); // Create a new team
        res.status(201).json(newTeam);                            // Send the created team as JSON response
    } catch (error) {
        res.status(500).json({ error: 'Failed to create team' });
    }
};

exports.deleteTeam = async (req, res) => {
    const teamId = req.params.id;
    try {
        const deleted = await team.destroy({ where: { id: teamId } }); // Delete team by ID
        if (deleted) {
            res.json({ message: `Team with id ${teamId} deleted successfully` });
        } else {
            res.status(404).json({ error: `Team with id ${teamId} not found` });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete team' });
    }
};

exports.updateTeam = async (req, res) => {
    const teamId = req.params.id;
    // const { name, description } = req.body; // Updated team data from request body
    try {
        const [updated] = await team.update(
            { ...sanitizeInput(req.body, ALLOWED_UPDATE_FIELDS), updatedBy: req.user.id },               // New values to update
            { where: { id: teamId } }           // Condition to find the team
        );
        if (updated) {
            const updatedTeam = await team.findByPk(teamId);
            res.json(updatedTeam);
        } else {
            res.status(404).json({ error: `Team with id ${teamId} not found` });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
};
