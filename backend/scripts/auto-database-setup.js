/*
AUTOMATIC DATABASE INITIALIZATION
This module handles automatic database setup when the application starts.

WHEN THIS RUNS:
- Every time the application starts
- Only creates database if it doesn't exist
- Only syncs models if tables are missing
- Safe for production use

HOW TO USE:
- Import this module in your app.js
- Call ensureDatabaseExists() before starting the server
*/

const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

class AutoDatabaseSetup {
    constructor(sequelizeInstance) {
        this.sequelize = sequelizeInstance;
        this.config = sequelizeInstance.config;
    }

    // Check if database exists
    async checkDatabaseExists() {
        let connection = null;
        try {
            // Connect without specifying database
            connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.username,
                password: this.config.password
            });

            // Check if database exists
            const [rows] = await connection.execute(
                'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
                [this.config.database]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking database existence:', error.message);
            return false;
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    // Create database if it doesn't exist
    async createDatabaseIfNeeded() {
        const exists = await this.checkDatabaseExists();
        
        if (exists) {
            console.log(`✅ Database '${this.config.database}' already exists`);
            return true;
        }

        console.log(`🏗️  Creating database '${this.config.database}'...`);

        let connection = null;
        try {
            connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.username,
                password: this.config.password
            });

            await connection.execute(
                `CREATE DATABASE \`${this.config.database}\` 
                 CHARACTER SET utf8mb4 
                 COLLATE utf8mb4_unicode_ci`
            );

            console.log(`✅ Database '${this.config.database}' created successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to create database '${this.config.database}':`, error.message);
            return false;
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    // Check if tables exist
    async checkTablesExist() {
        try {
            const [tables] = await this.sequelize.query("SHOW TABLES");
            return tables.length > 0;
        } catch (error) {
            console.log('No tables found or database connection issue');
            return false;
        }
    }

    // Sync models if needed
    async syncModelsIfNeeded() {
        const tablesExist = await this.checkTablesExist();
        
        if (tablesExist) {
            console.log('✅ Database tables already exist');
            return true;
        }

        console.log('📋 Creating database tables from models...');
        
        try {
            await this.sequelize.sync({ alter: false });
            console.log('✅ Database tables created successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to create database tables:', error.message);
            return false;
        }
    }

    // Main function to ensure database is ready
    async ensureDatabaseReady(options = {}) {
        const { 
            createDatabase = true,
            syncModels = true,
            exitOnError = true
        } = options;

        try {
            // Step 1: Create database if needed
            if (createDatabase) {
                const dbReady = await this.createDatabaseIfNeeded();
                if (!dbReady && exitOnError) {
                    process.exit(1);
                }
            }

            // Step 2: Test connection
            await this.sequelize.authenticate();
            console.log('✅ Database connection established');

            // Step 3: Sync models if needed
            if (syncModels) {
                const modelsReady = await this.syncModelsIfNeeded();
                if (!modelsReady && exitOnError) {
                    process.exit(1);
                }
            }

            console.log('🎉 Database is ready for use');
            return true;

        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
            if (exitOnError) {
                process.exit(1);
            }
            return false;
        }
    }
}

// Factory function to create auto setup instance
function createAutoSetup(sequelizeInstance) {
    return new AutoDatabaseSetup(sequelizeInstance);
}

// Convenience function for quick setup
async function ensureDatabaseExists(sequelizeInstance, options = {}) {
    const autoSetup = new AutoDatabaseSetup(sequelizeInstance);
    return await autoSetup.ensureDatabaseReady(options);
}

module.exports = {
    AutoDatabaseSetup,
    createAutoSetup,
    ensureDatabaseExists
};

/*
USAGE IN APP.JS:

const express = require('express');
const { ensureDatabaseExists } = require('./scripts/auto-database-setup');
const db = require('./src/models');

const app = express();

// Ensure database exists before starting server
async function startServer() {
    try {
        // Auto-create database and tables if needed
        await ensureDatabaseExists(db.sequelize);
        
        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// OR WITH MORE CONTROL:

const { createAutoSetup } = require('./scripts/auto-database-setup');

async function startServer() {
    const autoSetup = createAutoSetup(db.sequelize);
    
    await autoSetup.ensureDatabaseReady({
        createDatabase: true,   // Create DB if not exists
        syncModels: true,       // Create tables if not exist
        exitOnError: false      // Don't exit on error
    });
    
    // Continue with server startup...
}
*/