/*
ENVIRONMENT-SPECIFIC DATABASE SETUP
This script creates databases for different environments (development, test, production)

PURPOSE:
Different environments need different database configurations:
- Development: Developer-friendly with sample data
- Testing: Clean, isolated, reset every time
- Staging: Production-like for final testing
- Production: Secure, stable, never reset

WHEN TO USE:
- Setting up multiple environments
- CI/CD pipelines
- Testing with separate databases
- Production deployment

ATTRIBUTE EXPLANATIONS:

database (string):
- Purpose: Name of the database to create
- Why different names: Prevents data mixing between environments
- Example: 'team_collab_dev' vs 'team_collab_prod'

seedData (boolean):
- Purpose: Whether to add sample/demo data after setup
- true: Adds default users, teams, projects for testing/demos
- false: Empty database, ready for real data

force (boolean):
- Purpose: Whether to drop existing tables before recreating
- true: DROP + CREATE (destroys existing data)
- false: CREATE IF NOT EXISTS (preserves existing data)
- CRITICAL: Should NEVER be true in production!

createUser (boolean):
- Purpose: Whether to create dedicated database user
- true: Creates limited-permission user for security
- false: Uses existing database credentials
- Best practice: Always true in production

username (string):
- Purpose: Name of the database user to create
- Why needed: Security isolation, not using root user
- Production best practice: Dedicated user with minimal permissions
*/

const DatabaseSetup = require('./setup-database');

// Environment configurations with detailed purpose explanations
const environments = {
    
    // DEVELOPMENT ENVIRONMENT
    // Purpose: Local development work on developer machines
    development: {
        database: 'team_collab_dev',           // Database name: Separate from production data
        seedData: true,                        // Seed sample data: Helpful for development/testing
        force: false                           // Don't drop tables: Preserve development data between restarts
    },
    
    // TEST ENVIRONMENT  
    // Purpose: Automated testing, CI/CD pipelines, unit tests
    test: {
        database: 'team_collab_test',          // Database name: Isolated test data, separate from dev/prod
        seedData: false,                       // No seed data: Tests should create their own clean data
        force: true                            // Always drop tables: Ensure clean state for each test run
    },
    
    // STAGING ENVIRONMENT
    // Purpose: Pre-production testing, client demos, QA validation
    staging: {
        database: 'team_collab_staging',       // Database name: Mirror production structure but separate data
        seedData: true,                        // Seed realistic data: For demos and realistic testing scenarios  
        force: false                           // Preserve data: Don't reset unless intentional
    },
    
    // PRODUCTION ENVIRONMENT
    // Purpose: Live application serving real users
    production: {
        database: 'team_collab_prod',          // Database name: Production database with real user data
        seedData: false,                       // No seed data: Production starts empty, real data comes from users
        force: false,                          // NEVER drop tables: Protect production data at all costs
        createUser: true,                      // Create dedicated user: Security best practice (not root user)
        username: 'team_collab_user'           // Database user: Dedicated user with limited permissions for security
    }
};

async function setupEnvironment(env) {
    // Get configuration for requested environment
    const envConfig = environments[env];
    
    // Validate environment exists
    if (!envConfig) {
        console.error(`❌ Unknown environment: ${env}`);
        console.log('Available environments:', Object.keys(environments).join(', '));
        return false;
    }

    console.log(`🌍 Setting up ${env} environment...`);
    
    // Set environment variables for database configuration
    // These variables will be used by the database setup system
    process.env.DB_NAME = envConfig.database;      // Override database name for this environment
    process.env.NODE_ENV = env;                    // Set Node.js environment mode
    
    // Create database setup instance and run with environment-specific config
    const setup = new DatabaseSetup();
    return await setup.setup(envConfig);           // Pass environment config (seedData, force, etc.)
}

// Run if called directly
if (require.main === module) {
    const env = process.argv[2] || process.env.NODE_ENV || 'development';
    
    setupEnvironment(env)
        .then(success => {
            console.log(`${success ? '✅' : '❌'} ${env} environment setup ${success ? 'completed' : 'failed'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Environment setup error:', error);
            process.exit(1);
        });
}

module.exports = { setupEnvironment, environments };

/*
USAGE:
node scripts/setup-env.js development
node scripts/setup-env.js test
node scripts/setup-env.js production
*/