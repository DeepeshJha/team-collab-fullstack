const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { EmailToken } = require('../models');

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
        // const newUser = await User.create({ name, email, password });
        const newUser = await User.create({ name, email, password });
        // Step 5: Send verification email
        // Generate verification token (24 hours expiry)
        const verificationToken = generateToken();
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create token record
        await EmailToken.createToken(newUser.id, verificationToken, 'verification', verificationExpiry);

        // Send verification email
        const verificationLink = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;
        await sendVerificationEmail(email, verificationLink);

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

const forgotPassword = async (req, res) => {
    try {
        // STEP 1: Get email from request
        const { email } = req.body;

        // STEP 2: Validate email is provided
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // STEP 3: Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Security: Don't reveal if email exists or not (prevents account enumeration)
            return res.status(404).json({ message: 'If email exists, password reset link will be sent' });
        }

        // STEP 4: Delete any existing password reset tokens for this user
        // WHY? So user can only have ONE active reset token at a time
        await EmailToken.destroy({ 
            where: { 
                userId: user.id, 
                type: 'password_reset' 
            } 
        });

        // STEP 5: Generate new random token (32 characters)
        const resetToken = generateToken();

        // STEP 6: Calculate expiry time (1 hour from now)
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour = 3600000 ms

        // STEP 7: Create new EmailToken record in database
        await EmailToken.create({
            userId: user.id,
            token: resetToken,
            type: 'password_reset',
            expiresAt: expiresAt
        });

        // STEP 8: Build reset link (user will click this in email)
        const resetLink = `${process.env.APP_URL}/auth/reset-password/${resetToken}`;

        // STEP 9: Send email with reset link
        await sendPasswordResetEmail(email, resetLink);

        // STEP 10: Return success response
        return res.json({ message: 'Password reset email sent successfully' });

    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPassword = async (req, res) => {
    // STEP 1: Get token and new password from request
    // STEP 2: Validate input
    // STEP 3: Validate password length (should be at least 6 chars)
    // STEP 4: Find EmailToken by token and type 'password_reset'
    // STEP 5: If token not found or expired, return error
    // STEP 6: Find associated user
    // STEP 7: Hash new password and update user's password or user.update does the hashing
    // STEP 8: Delete used EmailToken
    // STEP 9: Return success response
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if(password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const emailToken = await EmailToken.findOne({ where: { token, type: 'password_reset' } });
        // STEP 4: Use static method to validate token (checks expiry too)
        // const emailToken = await EmailToken.validateToken(token, 'password_reset');
        if(!emailToken) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        } else if(emailToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        const user = await User.findByPk(emailToken.userId);
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // user.password = await bcrypt.hash(password, 10);
        await user.update({ password })
        await emailToken.destroy();

        return res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }

}

const verifyEmail = async (req, res) => {
    // STEP 1: Get token from URL parameter
    // STEP 2: Validate token is provided
    // STEP 3: Find EmailToken by token and type 'verification'
    // STEP 4: If token not found or expired, return error
    // STEP 5: Find associated user
    // STEP 6: Mark user's isVerified to true
    // STEP 7: Delete used EmailToken
    // STEP 8: Return success response
    try {
        const { token } = req.params;
        if(!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // const emailToken = await EmailToken.validateToken(token, 'verification');
        const emailToken = await EmailToken.findOne({ where: { token, type: 'verification' } });
        if(!emailToken) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        } else if(emailToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Verification token has expired' });
        }

        const user = await User.findByPk(emailToken.userId);
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // await user.update({ isVerified: true });
        user.isVerified = true;
        await user.save();
        await emailToken.destroy();

        return res.json({ message: 'Email has been verified successfully' });
    } catch (error) {
        console.error('Error in verifyEmail:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail
};