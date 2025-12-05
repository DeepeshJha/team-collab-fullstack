const nodemailer = require("nodemailer");

// Looking to send emails in production? Check out our Email API/SMTP product!
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "c6cc7ee45f3617",
    pass: "a7edbebe860494"
  }
});

const crypto = require('crypto');

/**
 * Generate a random token of specified length
 * @param {number} length - Length of token (default 32)
 * @returns {string} Random token
 * 
 * EXAMPLE:
 * const token = generateToken();
 * // Returns: "a7f3e2b1c8d9f4a6b5c3d2e1f9a8b7c6"
 */
function generateToken(length = 32) {
    // crypto.randomBytes(16) creates 16 random bytes
    // .toString('hex') converts bytes to hexadecimal string
    // 16 bytes × 2 characters per byte = 32 character string
    return crypto.randomBytes(length / 2).toString('hex');
}

async function sendVerificationEmail(email, verificationLink) {
    const mailOptions = {
        from: 'no-reply@teamcollab.com',
        to: email,
        subject: 'Please verify your email address',
        html: `
                <h2>Welcome to teamcolab!</h2>
                <p>Please verify your email by clicking the link below:</p>
                <p>
                    <a href="${verificationLink}">Verify Email</a>
                </p>
                <p>Or copy this link: ${verificationLink}</p>
                <p> This link expires in 24 hours. </p>
                <p> If you did not sign up, please ignore this email. </p>
            `
    };

    try {
        const info = await transport.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetLink - Full URL user clicks to reset password
 * @returns {Promise} Email send result
 * 
 * EXAMPLE:
 * await sendPasswordResetEmail('john@example.com', 'http://localhost:3000/auth/reset-password/token456');
 */
async function sendPasswordResetEmail(email, resetLink) {
    const mailOptions = {
        from: 'noreply@teamcollab.com',
        to: email,
        subject: 'Reset Your Password',
        html: `
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p>
                <a href="${resetLink}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #dc3545;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">
                    Reset Password
                </a>
            </p>
            <p>Or copy this link: ${resetLink}</p>
            <p><strong>This link expires in 30 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>Your password will not change until you create a new one.</p>
        `
    };

    try {
        const info = await transport.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

module.exports = {
    generateToken,
    sendVerificationEmail,
    sendPasswordResetEmail
};
