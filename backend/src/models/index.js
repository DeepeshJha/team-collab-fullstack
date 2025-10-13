'use strict';

// Import required Node.js modules
const fs = require('fs');           // File System - to read files and directories
const path = require('path');       // Path utilities - to work with file and directory paths
const Sequelize = require('sequelize'); // Sequelize ORM - our database toolkit
const process = require('process'); // Process - to access environment variables

// Get the current file name ('index.js')
// This helps us skip this file when loading other model files
const basename = path.basename(__filename);

// Determine which environment we're running in (development, test, production)
// If NODE_ENV is not set, default to 'development'
const env = process.env.NODE_ENV || 'development';

// Load database configuration for current environment
// This reads from config/config.json and picks the right environment section
const config = require('../../config/config.json')[env];

// Empty object that will hold all our database models
// After loading, this will contain: { User: UserModel, Team: TeamModel, etc. }
const db = {};

// Create the database connection
// Sequelize can connect in two ways:
// 1. Using a connection string (URL) stored in environment variable
// 2. Using individual config values (database name, username, password)
let sequelize;
if (config.use_env_variable) {
  // Method 1: Using connection string from environment variable
  // Example: DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Method 2: Using individual config values (most common)
  // Creates connection pool automatically with default settings:
  // - max: 5 connections, min: 0, acquire: 60000ms, idle: 10000ms
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Auto-load all model files from the current directory
// This is the magic that finds and loads all your model files automatically!
fs
  .readdirSync(__dirname)        // Read all files in the /models directory
  .filter(file => {              // Filter to get only the model files we want
    return (
      file.indexOf('.') !== 0 &&        // Skip hidden files (like .gitignore)
      file !== basename &&              // Skip index.js itself (that's this file!)
      file.slice(-3) === '.js' &&       // Only include .js files
      file.indexOf('.test.js') === -1   // Skip test files (like user.test.js)
    );
  })
  .forEach(file => {             // For each model file (user.js, team.js, etc.)
    // Load the model file and pass sequelize instance and DataTypes to it
    // This calls the function exported from user.js: (sequelize, DataTypes) => { ... }
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    
    // Add the model to our db object using the model's name as the key
    // Example: db['User'] = UserModel, db['Team'] = TeamModel
    db[model.name] = model;
  });

// Setup relationships between models
// Each model can have an 'associate' function that defines relationships with other models
// This runs AFTER all models are loaded, so all models are available for relationships
Object.keys(db).forEach(modelName => {
  // Check if this model has an associate function
  if (db[modelName].associate) {
    // Call the associate function and pass all models to it
    // This allows each model to set up relationships like User.hasMany(Task)
    db[modelName].associate(db);
  }
});

// Add the sequelize instance and Sequelize constructor to the db object
// This gives access to the database connection and Sequelize utilities
db.sequelize = sequelize;  // The actual database connection instance
db.Sequelize = Sequelize;  // The Sequelize constructor (for data types, operators, etc.)

// Export the entire db object
// Now other files can import models like: const { User, Team } = require('./models')
module.exports = db;