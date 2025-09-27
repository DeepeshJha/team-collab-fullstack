/*
ENVIRONMENT-SPECIFIC DATABASE SETUP
This script creates databases for different environments (development, test, production)

WHEN TO USE:
- Setting up multiple environments
- CI/CD pipelines
- Testing with separate databases
- Production deployment
*/

const DatabaseSetup = require('./setup-database');

// Environment configurations
const environments = {
    development: {
        database: 'team_collab_dev',
        seedData: true,
        force: false
    },
    test: {
        database: 'team_collab_test',
        seedData: false,
        force: true  // Always reset test database
    },
    staging: {
        database: 'team_collab_staging',
        seedData: true,
        force: false
    },
    production: {
        database: 'team_collab_prod',
        seedData: false,
        force: false,
        createUser: true,
        username: 'team_collab_user'
    }
};

async function setupEnvironment(env) {
    const envConfig = environments[env];
    if (!envConfig) {
        console.error(`❌ Unknown environment: ${env}`);
        console.log('Available environments:', Object.keys(environments).join(', '));
        return false;
    }

    console.log(`🌍 Setting up ${env} environment...`);
    
    // Set environment variables
    process.env.DB_NAME = envConfig.database;
    process.env.NODE_ENV = env;
    
    const setup = new DatabaseSetup();
    return await setup.setup(envConfig);
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