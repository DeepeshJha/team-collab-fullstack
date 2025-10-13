const { User } = require('../models');

// =============================================================================
// USER CONTROLLER - Complete CRUD Operations for User Management
// =============================================================================

const createUser = async (req, res) => {
    try {
        // 1. Get data from req.body
        // 2. Validate the data (check if required fields exist)
        // 3. Hash the password (for security)
        // 4. Save to database
        // 5. Remove password from response
        // 6. Send success response
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        } 
        const newUser = await User.create({ name, email, password });
        newUser.password = undefined;
        return res.status(201).json(newUser);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        console.error('createUser -> Error creating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        // 1. Get user ID from req.params
        // 2. Get updated data from req.body
        // 3. Find user by ID
        // 4. If user not found, return 404
        // 5. Update user fields
        // 6. Save changes to database
        // 7. Return updated user (hide password)
        let userId = req.params.id;
        let { name, email, password } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else if (user.name === name && user.email === email && user.password === password) {
            return res.status(401).json({ message: 'No changes detected' });
        } else if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res.status(409).json({ message: 'Email already in use' });
            }
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.password = password || user.password;
        await user.save();
        user.password = undefined;
        return res.json(user);
        // add commented code and description and purpose for User.update() - alternative way
        /*
            // Alternative way using User.update() - updates directly in DB
            // Note: This does not run instance-level hooks or validations
            // Useful for bulk updates but less flexible for single instances
        await User.update(
            { name, email, password },
            { where: { id: userId } }
        );
        */
    } catch (error) {
        console.error('updateUser -> Error updating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error('getAllUsers -> Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserById = async (req, res) => {
    try {
        // Get ID from params
        // Find user by primary key
        // Check if exists
        // Hide password and return
        let userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.password = undefined; // Hide password
        res.json(user);
    } catch (error) {
        // Handle errors
        console.error('getUserById -> Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        let userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUser -> Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// =============================================================================
// EXPORT ALL CONTROLLER FUNCTIONS
// =============================================================================
module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
};