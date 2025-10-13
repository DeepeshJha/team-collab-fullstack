const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
    /** User registration */
    /** 
     * 1. Get username, email, password from req.body
     * 2. Validate input (check if email already exists)
     * 3. Check if email already exists
     * 4. Hash password using bcrypt
     * 5. Save user to database
     * 6. Generate JWT token
     * 7. Return success response (exclude password)
     */
    try {
        // Step 1: Get data from req.body
        const { name, email, password } = req.body;
        // Step 2: Validate input (basic validation)
        // (In a real app, use a library like Joi or express-validator for robust validation)
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        // Step 3: Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        // Step 4: Create the user (password will be hashed by the model hook)
        const newUser = await User.create({ name, email, password });

        // Step 6: Generate JWT token (optional, can be done during login)
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET || 'my_jwt_secret',
            { expiresIn: '1h' }
        );

        // Step 5: Return success response (exclude password)
        return res.status(201).json(
            { 
                message: 'User registered successfully', 
                user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, 
                token  // return the token as well
            });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const login = async (req, res) => {
    /**
     * User login process:
     * 1. Get email and password from req.body
     * 2. Validate input
     * 3. Find user by email
     * 4. Compare password with hashed password
     * 5. Generate JWT token
     * 6. Return success response with token
     */
    try {
        // Step 1: Get data from req.body
        const { email, password } = req.body;
        // Step 2: Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // Step 3: Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Step 4: Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Step 5: Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'my_jwt_secret',
            { expiresIn: '1h' }
        );
        // Step 6: Return success response with token
        return res.json({ 
            message: 'Login successful', 
            user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
            token 
        });    

    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    register,
    login
};