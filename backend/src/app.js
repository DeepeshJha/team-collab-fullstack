const express = require('express'); // Import Express framework
const cors = require('cors');       // Enable Cross-Origin Resource Sharing
const morgan = require('morgan');   // HTTP request logger middleware
require('dotenv').config();         // Load environment variables from .env

const db = require('./models');     // Import database models
const { ensureDatabaseExists } = require('../scripts/auto-database-setup'); // Auto DB setup

const indexRouter = require('./routes'); // Import main router

const app = express();              // Create Express app instance

app.use(cors());                    // Allow requests from other origins (frontend)
app.use(express.json());            // Parse incoming JSON requests
app.use(morgan('dev'));             // Log HTTP requests in development format

app.use('/', indexRouter);          // Use the main router for root path

const PORT = process.env.PORT || 5000; // Get port from .env or default to 5000

async function initialize() {
    try {
        console.log('🚀 Starting Team Collaboration Backend...');
        
        // Automatically create database and tables if they don't exist
        await ensureDatabaseExists(db.sequelize, {
            createDatabase: true,   // Create database if it doesn't exist
            syncModels: true,       // Create tables from models if they don't exist
            exitOnError: false      // Don't exit on error, just log it
        });
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`🎉 Server running on port ${PORT}`);
            console.log(`🔗 API available at: http://localhost:${PORT}`);
            console.log(`📊 Database: ${db.sequelize.config.database}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    initialize();
}

module.exports = app;               // Export app for testing or further use