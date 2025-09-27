// mysql2 - for direct MySQL connection (without database) and /promise for async/await and modern syntax
const mysql = require('mysql2/promise');

// models from src/models - for Sequelize and our models
const db = require('../src/models');

const env = process.env.NODE_ENV || 'development';
const config = require('../src/config/config.json')[env];

// What functions will we create?
// 1. Connect to MySQL (without database)
// 2. Create database
// 3. Test connection with Sequelize
// 4. Create tables

console.log('Starting database setup...');

async function connectToMySQL() {
    console.log('Connecting to MySQL server...');
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password
        })
        
        console.log('✅ Connected to MySQL server successfully');
        return connection;  // Return connection for later use
    } catch(error) {
        console.error('❌ Failed to connect to MySQL server:');
        console.error(`   Host: ${config.host}:${config.port}`);
        console.error(`   User: ${config.username}`);
        console.error(`   Error: ${error.message}`);
        return null;
    }
}

async function createDatabase(connection) {
    console.log(`Creating database '${config.database}' if it doesn't exist...`);
    try {
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${config.database}' is ready`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create database '${config.database}':`, error.message);
        return false;
    }
}

async function testSequelizeConnection() {
    console.log('Testing connection to the application database...');
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

async function syncModels() {
    console.log('Creating/updating database tables from models...');
    try {
        await db.sequelize.sync({ alter: true }); // Use { force: true } to drop and recreate tables
        console.log('✅ All tables synchronized with models');
    } catch (error) {
        console.error('❌ Failed to synchronize models:', error.message);
    }
}

// Test the function
async function testConnection() {
    const connection = await connectToMySQL();
    if (connection) {
        console.log('🎉 Test successful!');
        let dbCreated = await createDatabase(connection);
         if (dbCreated) {
            console.log('🎉 Database creation test successful!');
            // Now test Sequelize connection
            const sequelizeOk = await testSequelizeConnection();
            if (sequelizeOk) {
                console.log('🎉 Sequelize connection test successful!');
                // Now sync models
                await syncModels();
                console.log('🎉 All steps completed successfully!');
            } else {
                console.log('❌ Sequelize connection test failed!');
            }
        } else {
            console.log('❌ Database creation failed!');
        }

        // Close the connection
        await connection.end(); // Always close connections
    } else {
        console.log('❌ Test failed!');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testConnection();
}


// /*
// DATABASE SETUP SCRIPT
// This script handles automatic database creation and setup for the team collaboration system.

// WHAT THIS SCRIPT DOES:
// 1. Connects to MySQL without specifying a database
// 2. Creates the database if it doesn't exist
// 3. Creates a user with proper permissions (optional)
// 4. Tests the connection to the new database
// 5. Syncs all models to create tables

// WHEN TO RUN THIS:
// - First time setting up the application
// - After cloning the repository
// - When switching to a new environment (development/staging/production)
// - When database needs to be reset

// HOW TO RUN:
// - npm run setup-db
// - node scripts/setup-database.js
// */

// const mysql = require('mysql2/promise');
// const { Sequelize } = require('sequelize');

// // Import your models (we'll use the index.js to load all models)
// const db = require('../src/models');

// // Database configuration
// const config = {
//     // MySQL connection without database specified (to create the database)
//     host: process.env.DB_HOST || 'localhost',
//     port: process.env.DB_PORT || 3306,
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
    
//     // Target database details
//     database: process.env.DB_NAME || 'team_collab_db',
//     charset: 'utf8mb4',
//     collation: 'utf8mb4_unicode_ci'
// };

// class DatabaseSetup {
//     constructor() {
//         this.config = config;
//         this.connection = null;
//     }

//     // Step 1: Connect to MySQL server (without database)
//     async connectToMySQL() {
//         console.log('🔌 Connecting to MySQL server...');
        
//         try {
//             this.connection = await mysql.createConnection({
//                 host: this.config.host,
//                 port: this.config.port,
//                 user: this.config.user,
//                 password: this.config.password
//             });
            
//             console.log('✅ Connected to MySQL server successfully');
//             return true;
//         } catch (error) {
//             console.error('❌ Failed to connect to MySQL server:');
//             console.error(`   Host: ${this.config.host}:${this.config.port}`);
//             console.error(`   User: ${this.config.user}`);
//             console.error(`   Error: ${error.message}`);
            
//             // Provide helpful suggestions
//             this.provideTroubleshootingTips(error);
//             return false;
//         }
//     }

//     // Step 2: Create database if it doesn't exist
//     async createDatabase() {
//         console.log(`🏗️  Creating database '${this.config.database}' if it doesn't exist...`);
        
//         try {
//             // Create database with proper charset and collation for international support
//             await this.connection.execute(
//                 `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` 
//                  CHARACTER SET ${this.config.charset} 
//                  COLLATE ${this.config.collation}`
//             );
            
//             console.log(`✅ Database '${this.config.database}' is ready`);
//             return true;
//         } catch (error) {
//             console.error(`❌ Failed to create database '${this.config.database}':`, error.message);
//             return false;
//         }
//     }

//     // Step 3: Create database user (optional, for production)
//     async createDatabaseUser(username, password, host = 'localhost') {
//         console.log(`👤 Creating database user '${username}' if needed...`);
        
//         try {
//             // Create user if not exists
//             await this.connection.execute(
//                 `CREATE USER IF NOT EXISTS '${username}'@'${host}' IDENTIFIED BY '${password}'`
//             );
            
//             // Grant permissions on the database
//             await this.connection.execute(
//                 `GRANT ALL PRIVILEGES ON \`${this.config.database}\`.* TO '${username}'@'${host}'`
//             );
            
//             // Refresh privileges
//             await this.connection.execute('FLUSH PRIVILEGES');
            
//             console.log(`✅ Database user '${username}' configured with proper permissions`);
//             return true;
//         } catch (error) {
//             console.error(`❌ Failed to create database user '${username}':`, error.message);
//             return false;
//         }
//     }

//     // Step 4: Test connection to the created database
//     async testDatabaseConnection() {
//         console.log('🧪 Testing connection to the application database...');
        
//         try {
//             // Close the MySQL connection
//             if (this.connection) {
//                 await this.connection.end();
//             }
            
//             // Test Sequelize connection to the specific database
//             await db.sequelize.authenticate();
//             console.log('✅ Database connection test successful');
//             return true;
//         } catch (error) {
//             console.error('❌ Database connection test failed:', error.message);
//             return false;
//         }
//     }

//     // Step 5: Sync all models to create tables
//     async syncModels(force = false) {
//         console.log('📋 Creating/updating database tables from models...');
        
//         try {
//             // Sync all models
//             // force: true will drop and recreate tables (use carefully!)
//             // alter: true will alter tables to match models (safer for development)
//             const syncOptions = force ? 
//                 { force: true } : 
//                 { alter: true };
            
//             await db.sequelize.sync(syncOptions);
            
//             if (force) {
//                 console.log('✅ All tables recreated from models (force sync)');
//             } else {
//                 console.log('✅ All tables synchronized with models');
//             }
            
//             // List created tables
//             const [tables] = await db.sequelize.query("SHOW TABLES");
//             console.log('📊 Created tables:');
//             tables.forEach(table => {
//                 const tableName = Object.values(table)[0];
//                 console.log(`   - ${tableName}`);
//             });
            
//             return true;
//         } catch (error) {
//             console.error('❌ Failed to sync models:', error.message);
//             return false;
//         }
//     }

//     // Step 6: Seed initial data (optional)
//     async seedInitialData() {
//         console.log('🌱 Seeding initial data...');
        
//         try {
//             // Create a default admin user if no users exist
//             const userCount = await db.User.count();
//             if (userCount === 0) {
//                 await db.User.create({
//                     name: 'Admin User',
//                     email: 'admin@example.com',
//                     password: 'admin123', // In real app, this should be hashed
//                     role: 'admin',
//                     isActive: true
//                 });
//                 console.log('👤 Created default admin user (admin@example.com / admin123)');
//             }
            
//             // Create a default team if no teams exist
//             const teamCount = await db.Team.count();
//             if (teamCount === 0) {
//                 const adminUser = await db.User.findOne({ where: { role: 'admin' } });
//                 if (adminUser) {
//                     await db.Team.create({
//                         name: 'Default Team',
//                         description: 'Default team for getting started',
//                         createdBy: adminUser.id,
//                         isActive: true
//                     });
//                     console.log('👥 Created default team');
//                 }
//             }
            
//             console.log('✅ Initial data seeding completed');
//             return true;
//         } catch (error) {
//             console.error('❌ Failed to seed initial data:', error.message);
//             return false;
//         }
//     }

//     // Main setup function
//     async setup(options = {}) {
//         console.log('🚀 Starting database setup...\n');
        
//         const {
//             force = false,          // Force recreate tables
//             seedData = true,        // Seed initial data
//             createUser = false,     // Create database user
//             username = null,        // Database username to create
//             userPassword = null     // Database user password
//         } = options;

//         try {
//             // Step 1: Connect to MySQL
//             const connected = await this.connectToMySQL();
//             if (!connected) return false;

//             // Step 2: Create database
//             const dbCreated = await this.createDatabase();
//             if (!dbCreated) return false;

//             // Step 3: Create user (optional)
//             if (createUser && username && userPassword) {
//                 await this.createDatabaseUser(username, userPassword);
//             }

//             // Step 4: Test database connection
//             const connectionTest = await this.testDatabaseConnection();
//             if (!connectionTest) return false;

//             // Step 5: Sync models
//             const modelsSynced = await this.syncModels(force);
//             if (!modelsSynced) return false;

//             // Step 6: Seed initial data (optional)
//             if (seedData) {
//                 await this.seedInitialData();
//             }

//             console.log('\n🎉 Database setup completed successfully!');
//             console.log('💡 You can now start your application');
//             return true;

//         } catch (error) {
//             console.error('\n💥 Database setup failed:', error.message);
//             return false;
//         } finally {
//             // Clean up connection
//             if (this.connection) {
//                 await this.connection.end();
//             }
//             // Close Sequelize connection
//             await db.sequelize.close();
//         }
//     }

//     // Provide troubleshooting tips based on error
//     provideTroubleshootingTips(error) {
//         console.log('\n💡 Troubleshooting tips:');
        
//         if (error.code === 'ECONNREFUSED') {
//             console.log('   - Make sure MySQL server is running');
//             console.log('   - Check if the port 3306 is correct');
//             console.log('   - Try: net start mysql (Windows) or brew services start mysql (Mac)');
//         }
        
//         if (error.code === 'ER_ACCESS_DENIED_ERROR') {
//             console.log('   - Check your username and password');
//             console.log('   - Make sure the user has proper permissions');
//             console.log('   - Try connecting with MySQL Workbench or command line first');
//         }
        
//         if (error.code === 'ENOTFOUND') {
//             console.log('   - Check the hostname/IP address');
//             console.log('   - Make sure you can ping the database server');
//         }
        
//         console.log('   - Check your .env file for correct database credentials');
//         console.log('   - Ensure MySQL service is installed and running');
//     }
// }

// // Export for use in other files
// module.exports = DatabaseSetup;

// // Run setup if this file is executed directly
// if (require.main === module) {
//     const setup = new DatabaseSetup();
    
//     // Parse command line arguments
//     const args = process.argv.slice(2);
//     const options = {
//         force: args.includes('--force'),
//         seedData: !args.includes('--no-seed'),
//         createUser: args.includes('--create-user')
//     };
    
//     console.log('📖 Command line options:');
//     console.log('   --force        : Drop and recreate all tables');
//     console.log('   --no-seed      : Skip seeding initial data');
//     console.log('   --create-user  : Create a database user');
//     console.log('');
    
//     setup.setup(options)
//         .then(success => {
//             process.exit(success ? 0 : 1);
//         })
//         .catch(error => {
//             console.error('Setup error:', error);
//             process.exit(1);
//         });
// }

// /*
// USAGE EXAMPLES:

// 1. BASIC SETUP (First time):
//    node scripts/setup-database.js

// 2. FORCE RECREATE TABLES:
//    node scripts/setup-database.js --force

// 3. SETUP WITHOUT SEEDING:
//    node scripts/setup-database.js --no-seed

// 4. SETUP WITH USER CREATION:
//    node scripts/setup-database.js --create-user

// 5. IN PACKAGE.JSON:
//    "scripts": {
//      "setup-db": "node scripts/setup-database.js",
//      "reset-db": "node scripts/setup-database.js --force",
//      "setup-db-prod": "node scripts/setup-database.js --create-user --no-seed"
//    }

// 6. PROGRAMMATIC USAGE:
//    const DatabaseSetup = require('./scripts/setup-database');
//    const setup = new DatabaseSetup();
   
//    setup.setup({
//      force: false,
//      seedData: true,
//      createUser: true,
//      username: 'app_user',
//      userPassword: 'secure_password'
//    });
// */