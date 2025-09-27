// test-connection.js
const { sequelize } = require('../src/models');

async function testConnection() {
    try {
        console.log('🔄 Testing database connection...');
        console.log(`📍 Connecting to: ${sequelize.config.database}@${sequelize.config.host}:${sequelize.config.port}`);
        
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');
        
        // Test model loading
        const models = Object.keys(sequelize.models);
        console.log('📋 Loaded models:', models);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

testConnection();

module.exports = testConnection;