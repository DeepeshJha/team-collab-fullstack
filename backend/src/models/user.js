/*
WHAT IS THIS FILE?
This file defines the User model for our team collaboration application.
A model in Sequelize represents a table in our database and provides methods to interact with it.

WHAT DOES A USER REPRESENT?
- A person who can log into the system
- Someone who can create teams, projects, and tasks  
- A team member who can be assigned work
- A user who can send messages and collaborate

KEY CONCEPTS FOR BEGINNERS:
- Model = A JavaScript class that represents a database table
- Instance = A single record/row in that table (like one specific user)
- Static Methods = Functions called on the model itself (User.findAll())
- Instance Methods = Functions called on a specific user record (user.getName())
- Relationships = How tables connect to each other (User has many Teams)
*/

// Import the Model class from Sequelize
// Model is the base class that all our database models will extend from
// Think of it as a superclass that gives us database superpowers!
const { Model } = require('sequelize');

// Import bcrypt for password hashing
const bcrypt = require('bcrypt');

// Export a function that takes sequelize connection and DataTypes
// This pattern allows the index.js file to pass these parameters when loading models
// WHY A FUNCTION? Because we need to pass the database connection to each model
// sequelize = the actual database connection
// DataTypes = all the data types we can use (STRING, INTEGER, BOOLEAN, etc.)
module.exports = (sequelize, DataTypes) => {
    
    // Define User class that extends Sequelize's Model class
    // WHAT DOES 'extends Model' MEAN?
    // - User inherits all the database methods from Model
    // - We get methods like: User.create(), User.findAll(), User.update(), User.destroy()
    // - Each user instance gets methods like: user.save(), user.update(), user.destroy()
    class User extends Model {
        
        /**
         * WHAT ARE ASSOCIATIONS?
         * Associations define relationships between different tables in our database.
         * Think of them as connections: "A user can belong to many teams"
         * 
         * WHEN IS THIS CALLED?
         * This static method is called automatically by index.js after all models are loaded.
         * It runs once when the application starts up.
         * 
         * @param {Object} models - Object containing all loaded models (User, Team, Project, etc.)
         *                         Example: models.Team, models.Project, models.Task, models.Message
         */
        static associate(models) {
            
            /*
            RELATIONSHIP TYPES EXPLAINED:
            
            1. One-to-Many (hasMany): One user can have many teams, but each team belongs to one user
               Example: One author can write many books, but each book has one author
               
            2. Many-to-Many (belongsToMany): Many users can belong to many teams
               Example: Many students can take many courses, and many courses can have many students
               
            3. One-to-One (hasOne/belongsTo): One user has one profile, one profile belongs to one user
               Example: One person has one passport, one passport belongs to one person
            */
            
            // RELATIONSHIP 1: User Creates Many Teams (One-to-Many)
            // REAL WORLD EXAMPLE: One company CEO can create multiple teams/departments
            // DATABASE EXPLANATION: Creates a 'createdBy' column in the teams table that stores the user's ID
            User.hasMany(models.Team, {
                foreignKey: 'createdBy',    // Column name in teams table that points to this user
                as: 'createdTeams'          // Alias name - used when fetching: user.getCreatedTeams()
            });
            // SQL EQUIVALENT: SELECT * FROM teams WHERE createdBy = userId
            // USAGE: const userTeams = await user.getCreatedTeams();

            
            // RELATIONSHIP 2: User Belongs to Many Teams (Many-to-Many)
            // REAL WORLD EXAMPLE: 
            // - John can be member of "Frontend Team", "Marketing Team", and "Design Team"
            // - "Frontend Team" can have members: John, Jane, Bob, Alice
            // WHY MANY-TO-MANY? Because both sides can have multiple relationships
            
            // JUNCTION TABLE EXPLANATION:
            // Since databases can't directly store many-to-many relationships,
            // we need a "bridge" table called TeamMembers that stores pairs of IDs:
            // TeamMembers table: | userId | teamId | joinedAt | role |
            //                   |   1    |   5    | 2024-01-15 | member |
            //                   |   1    |   8    | 2024-02-01 | admin  |
            //                   |   2    |   5    | 2024-01-20 | member |
            
            User.belongsToMany(models.Team, {
                through: 'TeamMembers',     // Name of the junction/bridge table
                foreignKey: 'userId',       // Column in TeamMembers that stores THIS user's ID
                otherKey: 'teamId',         // Column in TeamMembers that stores the team's ID
                as: 'teams'                 // Alias for queries: user.getTeams(), user.addTeam()
            });
            // USAGE EXAMPLES:
            // const userTeams = await user.getTeams();           // Get all teams user belongs to
            // await user.addTeam(teamId);                       // Add user to a team
            // await user.removeTeam(teamId);                    // Remove user from team
            // const teamCount = await user.countTeams();        // Count user's teams

            // RELATIONSHIP 3: User Creates Many Projects (One-to-Many)
            // REAL WORLD EXAMPLE: A project manager can create multiple projects
            // DATABASE: Adds 'createdBy' column in projects table
            User.hasMany(models.Project, {
                foreignKey: 'createdBy',    // Column in projects table that stores creator's user ID
                as: 'createdProjects'       // Alias: user.getCreatedProjects(), user.createCreatedProject()
            });
            // USAGE: const projects = await user.getCreatedProjects();

            // RELATIONSHIP 4: User Assigned to Many Projects (Many-to-Many)
            // REAL WORLD EXAMPLE: 
            // - Developer John works on "Mobile App" and "Website Redesign" projects
            // - "Mobile App" project has developers: John, Sarah, Mike
            // JUNCTION TABLE: ProjectAssignees stores user-project assignments
            User.belongsToMany(models.Project, {
                through: 'ProjectAssignees', // Bridge table: | userId | projectId | assignedAt | role |
                foreignKey: 'userId',        // Column for user ID in ProjectAssignees table
                otherKey: 'projectId',       // Column for project ID in ProjectAssignees table
                as: 'assignedProjects'       // Alias: user.getAssignedProjects(), user.addAssignedProject()
            });
            // USAGE: await user.addAssignedProject(projectId, { through: { role: 'developer' } });

            // RELATIONSHIP 5: User Assigned to Many Tasks (One-to-Many)
            // REAL WORLD EXAMPLE: A developer can be assigned multiple tasks to complete
            // NOTE: Each task can only be assigned to ONE person (that's why it's One-to-Many, not Many-to-Many)
            User.hasMany(models.Task, {
                foreignKey: 'assignedTo',   // Column in tasks table that stores assigned user's ID
                as: 'assignedTasks'         // Alias: user.getAssignedTasks(), user.createAssignedTask()
            });
            // USAGE: const myTasks = await user.getAssignedTasks({ where: { status: 'in-progress' } });

            // RELATIONSHIP 6: User Creates Many Tasks (One-to-Many)
            // REAL WORLD EXAMPLE: A team lead can create tasks for team members
            // DIFFERENCE FROM RELATIONSHIP 5: This is about WHO CREATED the task, not who it's assigned to
            User.hasMany(models.Task, {
                foreignKey: 'createdBy',    // Column in tasks table that stores creator's user ID
                as: 'createdTasks'          // Alias: user.getCreatedTasks(), user.createCreatedTask()
            });
            // USAGE: const tasksICreated = await user.getCreatedTasks();

            // RELATIONSHIP 7: User Sends Many Messages (One-to-Many)
            // REAL WORLD EXAMPLE: A user can send multiple messages in team chats
            // Each message has exactly one sender
            User.hasMany(models.Message, {
                foreignKey: 'senderId',     // Column in messages table that stores sender's user ID
                as: 'sentMessages'          // Alias: user.getSentMessages(), user.createSentMessage()
            });
            // USAGE: const recentMessages = await user.getSentMessages({ limit: 10, order: [['createdAt', 'DESC']] });

            // RELATIONSHIP 8: User Creates Many Comments (One-to-Many)
            // REAL WORLD EXAMPLE: A user can write comments on tasks and projects
            // Each comment has exactly one author
            User.hasMany(models.Comment, {
                foreignKey: 'userId',       // Column in comments table that stores author's user ID
                as: 'comments'              // Alias: user.getComments(), user.createComment()
            });
            // USAGE: const userComments = await user.getComments();

            // RELATIONSHIP 9: User Adds Many Reactions (One-to-Many)
            // REAL WORLD EXAMPLE: A user can add emoji reactions to messages, comments, and tasks
            // Each reaction has exactly one reactor
            User.hasMany(models.Reaction, {
                foreignKey: 'userId',       // Column in reactions table that stores reactor's user ID
                as: 'reactions'             // Alias: user.getReactions(), user.createReaction()
            });
            // USAGE: const userReactions = await user.getReactions();

            // RELATIONSHIP 10: User Uploads Many Attachments (One-to-Many)
            // REAL WORLD EXAMPLE: A user can upload files to tasks, projects, and messages
            // Each attachment has exactly one uploader
            User.hasMany(models.Attachment, {
                foreignKey: 'uploadedBy',   // Column in attachments table that stores uploader's user ID
                as: 'uploadedAttachments'   // Alias: user.getUploadedAttachments()
            });
            // USAGE: const userFiles = await user.getUploadedAttachments();
        }
    }

    /*
    WHAT IS User.init()?
    User.init() is the method that defines the structure of our users table.
    It tells Sequelize:
    1. What columns the table should have
    2. What data types each column should use
    3. What rules/constraints each column should follow
    4. What options the model should have
    
    Think of it like creating a blueprint for building a house - it specifies
    what rooms (columns) the house (table) should have and their properties.
    */
    
    // Initialize the User model with its attributes (columns) and options
    // FIRST PARAMETER: Object defining all the columns/fields in the users table
    // SECOND PARAMETER: Object with model configuration options
    User.init({
        
        /*
        COLUMN DEFINITION EXPLANATION:
        Each property in this object becomes a column in the database table.
        Each column definition can have:
        - type: What kind of data (STRING, INTEGER, BOOLEAN, etc.)
        - allowNull: Can this field be empty? (true = optional, false = required)
        - unique: Must this value be unique across all rows?
        - defaultValue: What value to use if none is provided?
        - validate: Rules to check if the data is valid
        */
        
        // COLUMN 1: User's Full Name
        // PURPOSE: Store the user's display name (e.g., "John Doe", "Sarah Smith")
        name: {
            type: DataTypes.STRING,         // VARCHAR(255) in SQL - can store text up to 255 characters
            allowNull: false,               // REQUIRED field - every user must have a name
            validate: {                     // VALIDATION RULES - check data before saving
                len: [2, 100],              // Name must be between 2 and 100 characters
                notEmpty: true,             // Name cannot be just spaces or empty
                // isAlpha: false              // Allow spaces and special characters in names
            },
            comment: 'User full name for display purposes' // Database comment for documentation
        },
        // DATABASE RESULT: name VARCHAR(255) NOT NULL COMMENT 'User full name for display purposes'
        
        // COLUMN 2: User's Email Address
        // PURPOSE: Unique identifier for login and communication
        email: {
            type: DataTypes.STRING,         // VARCHAR(255) in SQL
            allowNull: false,               // REQUIRED - every user needs an email
            unique: {
                name: 'unique_email',
                msg: 'Email already exists'  // ← Better error message
            },
            validate: {                     // VALIDATION RULES
                isEmail: {
                    msg: 'Must be a valid email address'
                },
                notEmpty: true
            },
            comment: 'User email address - used for login and notifications'
        },
        // DATABASE RESULT: email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address...'
        
        // COLUMN 3: User's Password
        // PURPOSE: Store hashed password for authentication
        // SECURITY NOTE: Never store plain text passwords! Always hash them first.
        password: {
            type: DataTypes.STRING,         // VARCHAR(255) - enough space for hashed passwords
            allowNull: false,               // REQUIRED - every user needs a password
            validate: {                     // VALIDATION RULES
                len: {
                    args: [6, 255],
                    msg: 'Password must be at least 6 characters'
                },
                notEmpty: true
            },
            comment: 'Hashed password - never store plain text passwords!'
        },
        // DATABASE RESULT: password VARCHAR(255) NOT NULL COMMENT 'Hashed password...'
        
        // COLUMN 4: Profile Picture URL
        // PURPOSE: Store link to user's profile image
        avatar: {
            type: DataTypes.STRING,         // VARCHAR(255) - URL to image file
            allowNull: true,                // OPTIONAL - users don't need profile pictures
            validate: {                     // VALIDATION RULES
                isUrl: true                 // Must be valid URL format if provided
            },
            comment: 'URL to user profile picture'
        },
        // DATABASE RESULT: avatar VARCHAR(255) COMMENT 'URL to user profile picture'
        
        // COLUMN 5: User's System Role
        // PURPOSE: Define what permissions the user has in the system
        // ENUM EXPLANATION: ENUM restricts values to only the specified options
        role: {
            type: DataTypes.ENUM('admin', 'member', 'viewer'),  // Only these 3 values allowed
            allowNull: false,               // REQUIRED - every user must have a role
            defaultValue: 'member',         // New users get 'member' role by default
            validate: {
                isIn: {
                    args: [['admin', 'member', 'viewer']],
                    msg: 'Role must be admin, member, or viewer'
                }
            },
            comment: 'User role: admin (full access), member (standard user), viewer (read-only)'
        },
        // DATABASE RESULT: role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member'
        
        // COLUMN 6: Account Status
        // PURPOSE: Enable/disable user accounts (for banning, deactivation, etc.)
        isActive: {
            type: DataTypes.BOOLEAN,        // BOOLEAN - true or false
            allowNull: false,               // REQUIRED - must specify if user is active
            defaultValue: true,             // New users are active by default
            comment: 'Whether user account is active and can login'
        },
        // DATABASE RESULT: isActive BOOLEAN NOT NULL DEFAULT true
        
        // COLUMN 7: Refresh Token
        // PURPOSE: Store refresh token for generating new access tokens
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Refresh token for generating new access tokens'
        },
        
        /*
        AUTOMATIC COLUMNS:
        Sequelize automatically adds these columns unless you disable timestamps:
        
        - id: INT PRIMARY KEY AUTO_INCREMENT
          Purpose: Unique identifier for each user (1, 2, 3, 4, ...)
          
        - createdAt: DATETIME NOT NULL
          Purpose: When this user record was created
          Example: '2024-01-15 14:30:25'
          
        - updatedAt: DATETIME NOT NULL  
          Purpose: When this user record was last modified
          Example: '2024-02-20 09:15:42'
        */
        
    }, {
        /*
        SECOND PARAMETER: MODEL OPTIONS
        This object configures how the User model behaves and how the database table is created.
        */
        
        // REQUIRED: Pass the database connection instance
        // This connects our model to the actual database
        sequelize,                          // The sequelize connection we got from the function parameter
        
        // MODEL NAMING OPTIONS
        modelName: 'User',                  // Internal name used by Sequelize (PascalCase)
        tableName: 'users',                 // Actual table name in database (lowercase, plural)
        // WHY DIFFERENT NAMES? 
        // - modelName: Used in code (User.findAll(), associations, etc.)
        // - tableName: Used in SQL queries (SELECT * FROM users)
        
        // TIMESTAMP OPTIONS
        timestamps: true,                   // Add createdAt and updatedAt columns automatically
        // WHAT DOES timestamps: true DO?
        // - Adds createdAt column that gets set when record is created
        // - Adds updatedAt column that gets updated whenever record changes
        // - If false: no automatic timestamp columns
        
        // COLUMN NAMING STYLE
        underscored: false,                 // Use camelCase for column names (createdAt, updatedAt)
        // OPTIONS:
        // - false: camelCase (createdAt, firstName, isActive)
        // - true: snake_case (created_at, first_name, is_active)
        
        // SOFT DELETE OPTIONS
        paranoid: false,                    // Don't use soft deletes for users
        // WHAT IS SOFT DELETE?
        // - paranoid: false = Hard delete (actually removes record from database)
        // - paranoid: true = Soft delete (adds deletedAt column, hides deleted records)
        // SOFT DELETE EXAMPLE: When user is "deleted", they're just marked as deleted but data remains
        
        // TABLE NAME OPTIONS
        freezeTableName: false,             // Allow Sequelize to pluralize model name
        // BEHAVIOR:
        // - false: User model → users table (automatic pluralization)
        // - true: User model → User table (exact match)
        
        // DATABASE CHARACTER SET OPTIONS
        charset: 'utf8mb4',                 // Character set for storing text (supports emojis!)
        collate: 'utf8mb4_unicode_ci',      // Collation for text comparison and sorting
        // WHY utf8mb4? 
        // - Supports emojis and special characters (😀, 中文, العربية)
        // - utf8 (old) only supports basic characters
        // - utf8mb4 (new) supports full Unicode including emojis
        
        // DATABASE INDEXES for better query performance
        // Indexes make database queries faster by creating shortcuts to find data
        indexes: [
            {
                unique: true,
                fields: ['email']           // Unique index on email (enforces uniqueness + faster lookups)
            },
            {
                fields: ['role']            // Index on role for faster filtering (WHERE role = 'admin')
            },
            {
                fields: ['isActive']        // Index on isActive for faster filtering active users
            },
            {
                fields: ['createdAt']       // Index on createdAt for faster sorting by registration date
            }
        ],
        // SQL EQUIVALENT:
        // CREATE UNIQUE INDEX idx_users_email ON users(email);
        // CREATE INDEX idx_users_role ON users(role);
        // CREATE INDEX idx_users_isActive ON users(isActive);
        // CREATE INDEX idx_users_createdAt ON users(createdAt);

        // HOOKS: Functions that run at specific points in the model lifecycle
        hooks: {
            // BEFORE CREATING A NEW USER
            beforeCreate: async (user) => {
                // Hash the user's password before saving to database (automatic!)
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                // If password is being changed, hash the new password
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        },
        // SQL EQUIVALENT:
        /*
        CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL COMMENT 'User full name for display purposes',
            email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address - used for login and notifications',
            password VARCHAR(255) NOT NULL COMMENT 'Hashed password - never store plain text passwords!',
            avatar VARCHAR(255) COMMENT 'URL to user profile picture',
            role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member' COMMENT 'User role: admin (full access), member (standard user), viewer (read-only)',
            isActive BOOLEAN NOT NULL DEFAULT true COMMENT 'Whether user account is active and can login',
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            UNIQUE INDEX idx_users_email (email),
            INDEX idx_users_role (role),
            INDEX idx_users_isActive (isActive),
            INDEX idx_users_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        */
    }); // <-- Close User.init here

    /*
    WHAT HAPPENS AFTER User.init()?
    
    1. Sequelize registers this User model in its internal model registry
    2. The model gets all the standard methods like:
       - User.create() - Create new user
       - User.findAll() - Get all users  
       - User.findByPk() - Find user by ID
       - User.update() - Update users
       - User.destroy() - Delete users
       
    3. Each user instance gets methods like:
       - user.save() - Save changes to this user
       - user.update() - Update this user's data
       - user.destroy() - Delete this user
       - user.getTeams() - Get teams this user belongs to (from associations)
       
    4. The model is returned and can be used throughout the application
    */

    // Return the User model so it can be used by index.js and throughout the application
    // This makes the User model available as: const { User } = require('../models');
    return User;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'User full name for display purposes',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address - used for login and notifications',
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password - never store plain text passwords!',
    avatar VARCHAR(255) COMMENT 'URL to user profile picture',
    role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member' COMMENT 'User role: admin (full access), member (standard user), viewer (read-only)',
    isActive BOOLEAN NOT NULL DEFAULT true COMMENT 'Whether user account is active and can login',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    UNIQUE INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_isActive (isActive),
    INDEX idx_users_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

HOW TO USE THIS MODEL:

// Create a new user
const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPasswordHere',
    role: 'member'
});

// Find all users
const users = await User.findAll();

// Find user by email
const user = await User.findOne({ where: { email: 'john@example.com' } });

// Find user with their teams
const userWithTeams = await User.findByPk(1, {
    include: [
        { model: Team, as: 'teams' },
        { model: Project, as: 'createdProjects' }
    ]
});

// Update user
await user.update({ name: 'John Smith' });

// Add user to a team (using association)
await user.addTeam(teamId);

// Get user's teams
const teams = await user.getTeams();

// Delete user
await user.destroy();
*/