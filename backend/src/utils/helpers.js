// Helper function to validate and sanitize input
const sanitizeInput = (input, allowedFields) => {
    const sanitized = {};
    
    allowedFields.forEach(field => {
        if (input.hasOwnProperty(field)) {
            sanitized[field] = input[field];
        }
    });
    
    return sanitized;
};

module.exports = { sanitizeInput };