/*
WHAT IS THE TEAM MODEL?
The Team model represents groups of users working together on projects.
Think of it like a department in a company or a squad in a sports team.

REAL WORLD EXAMPLES:
- "Frontend Development Team" - handles website user interface
- "Marketing Team" - manages campaigns and promotion  
- "Design Team" - creates visual assets and user experience
- "Backend Team" - manages servers and databases

KEY FEATURES OF TEAMS:
- Has a creator/owner (the person who made the team)
- Has multiple members (users who belong to the team)
- Contains projects (work items the team is responsible for)
- Has team chat (messages between team members)
- Can have tasks assigned directly to the team

WHAT DOES THIS FILE DO?
- Defines the structure of the teams table in the database
- Sets up relationships with other models (User, Project, Message, Task)
- Provides methods to work with team data
*/

// Import the Model class from Sequelize
// Model gives us all the database superpowers (create, find, update, delete)
const { Model } = require('sequelize');

// Export a function that receives database connection and data types
// This pattern allows index.js to pass the connection when loading models
module.exports = (sequelize, DataTypes) => {
    
    // Define Team class that extends Sequelize's Model class
    // This gives us access to methods like Team.create(), Team.findAll(), etc.
    class Team extends Model {
        
        // Static method to define relationships with other models
        // Called automatically after all models are loaded
        static associate(models) {
            
            /*
            TEAM RELATIONSHIPS EXPLAINED:
            
            Think of relationships like family connections:
            - "Team belongs to User" = Every team has one creator (like a family has one father/mother)
            - "Team has many members" = Multiple people belong to the team (like family has multiple children)
            - "Team has many projects" = Team works on multiple projects (like family has multiple responsibilities)
            */
            
            // RELATIONSHIP 1: Team belongs to one User (creator/owner)
            // REAL WORLD: Every team needs someone who created/leads it
            // DATABASE: Adds 'createdBy' column in teams table that references users.id
            Team.belongsTo(models.User, {
                foreignKey: 'createdBy',        // Column in teams table storing creator's user ID
                as: 'creator'                   // Alias for queries: team.getCreator()
            });
            // USAGE: const creator = await team.getCreator();
            // SQL EQUIVALENT: SELECT * FROM users WHERE id = team.createdBy;

            
            // RELATIONSHIP 2: Team has many Users as members (Many-to-Many)
            // REAL WORLD: A team can have multiple members, and a user can join multiple teams
            // EXAMPLE: John is in "Frontend Team" AND "Marketing Team"
            //          "Frontend Team" has members: John, Sarah, Mike
            // JUNCTION TABLE: Creates TeamMembers table to store team-user pairs
            Team.belongsToMany(models.User, {
                through: 'TeamMembers',         // Bridge table storing team-user relationships
                foreignKey: 'teamId',           // Column in TeamMembers for team ID
                otherKey: 'userId',             // Column in TeamMembers for user ID
                as: 'members'                   // Alias: team.getMembers(), team.addMember()
            });
            // USAGE: 
            // const members = await team.getMembers();
            // await team.addMember(userId, { through: { role: 'admin' } });
            // const memberCount = await team.countMembers();

            // RELATIONSHIP 3: Team has many Projects (One-to-Many)
            // REAL WORLD: A team works on multiple projects
            // EXAMPLE: "Frontend Team" works on "Mobile App", "Website Redesign", "Admin Panel"
            // DATABASE: Adds 'teamId' column in projects table
            Team.hasMany(models.Project, {
                foreignKey: 'teamId',           // Column in projects table storing team's ID
                as: 'projects'                  // Alias: team.getProjects(), team.createProject()
            });
            // USAGE: 
            // const projects = await team.getProjects();
            // const activeProjects = await team.getProjects({ where: { status: 'active' } });

            // RELATIONSHIP 4: Team has many Messages (team chat)
            // REAL WORLD: Team members send messages in team chat
            // EXAMPLE: Messages like "Good morning team!", "Meeting at 3pm", "Great job everyone!"
            // DATABASE: Adds 'teamId' column in messages table
            Team.hasMany(models.Message, {
                foreignKey: 'teamId',           // Column in messages table storing team's ID
                as: 'messages'                  // Alias: team.getMessages(), team.createMessage()
            });
            // USAGE:
            // const recentMessages = await team.getMessages({ limit: 50, order: [['createdAt', 'DESC']] });

            // RELATIONSHIP 5: Team has many Tasks (One-to-Many)
            // REAL WORLD: Teams can have tasks assigned directly (not just through projects)
            // EXAMPLE: "Prepare quarterly report", "Organize team building event"
            // DATABASE: Adds 'teamId' column in tasks table
            Team.hasMany(models.Task, {
                foreignKey: 'teamId',           // Column in tasks table storing team's ID
                as: 'tasks'                     // Alias: team.getTasks(), team.createTask()
            });
            // USAGE:
            // const pendingTasks = await team.getTasks({ where: { status: 'pending' } });
        }
    }

    /*
    TEAM.INIT() EXPLANATION:
    This method defines the structure of the teams table in our database.
    It specifies what information we want to store about each team.
    
    Think of it like designing a form - what fields do we need?
    - Team name (required)
    - Team description (optional)
    - Is it private? (yes/no)
    - Status (active, inactive, archived)
    - Team avatar/logo
    - Theme color
    - Who created it?
    - Maximum members allowed
    */
    
    Team.init({
        
        /*
        TEAM BASIC INFORMATION SECTION
        Core details that identify and describe the team
        */
        
        // TEAM NAME - What the team is called
        // EXAMPLES: "Frontend Development", "Marketing Squad", "Design Team"
        name: {
            type: DataTypes.STRING,         // VARCHAR(255) - can store up to 255 characters
            allowNull: false,               // REQUIRED - every team must have a name
            validate: {                     // VALIDATION RULES - check data before saving
                len: [3, 100],              // Name must be between 3 and 100 characters
                notEmpty: true              // Cannot be just spaces
            },
            comment: 'Team display name - what users see'
        },
        // DATABASE RESULT: name VARCHAR(255) NOT NULL COMMENT 'Team display name - what users see'
        
        // TEAM DESCRIPTION - What the team does
        // EXAMPLES: "Responsible for all frontend development and user experience"
        description: {
            type: DataTypes.TEXT,           // TEXT type - can store long descriptions
            allowNull: true,                // OPTIONAL - teams don't need descriptions
            validate: {                     // VALIDATION RULES
                len: [0, 500]               // Description max 500 characters
            },
            comment: 'Optional description explaining team purpose and responsibilities'
        },
        // DATABASE RESULT: description TEXT COMMENT 'Optional description explaining team purpose...'

        
        /*
        TEAM SETTINGS SECTION
        Configuration options that control team behavior
        */
        
        // TEAM PRIVACY - Who can see and join the team
        // PURPOSE: Control team visibility and membership
        isPrivate: {
            type: DataTypes.BOOLEAN,        // BOOLEAN - true or false
            allowNull: false,               // REQUIRED - must specify privacy level
            defaultValue: false,            // Public by default (anyone can see and join)
            comment: 'Whether team is private (invite-only) or public (anyone can join)'
        },
        // REAL WORLD EXAMPLES:
        // - Public team: "Open Source Contributors" - anyone can join
        // - Private team: "Executive Leadership" - invitation only
        // DATABASE RESULT: isPrivate BOOLEAN NOT NULL DEFAULT false

        // TEAM STATUS - Current state of the team
        // PURPOSE: Manage team lifecycle (active work, paused, finished)
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'archived'), // Only these values allowed
            allowNull: false,               // REQUIRED - every team must have a status
            defaultValue: 'active',         // New teams are active by default
            comment: 'Team status: active (working), inactive (paused), archived (completed/disbanded)'
        },
        // STATUS MEANINGS:
        // - active: Team is currently working and collaborating
        // - inactive: Team is temporarily paused (members still there, no active work)
        // - archived: Team work is finished (read-only, for historical reference)
        // DATABASE RESULT: status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active'

        /*
        TEAM BRANDING SECTION
        Visual identity and customization options
        */
        
        // TEAM AVATAR - Team profile picture/logo
        // PURPOSE: Visual identification in lists and chats
        avatar: {
            type: DataTypes.STRING,         // VARCHAR(255) - URL to image file
            allowNull: true,                // OPTIONAL - teams don't need avatars
            validate: {                     // VALIDATION RULES
                isUrl: true                 // Must be valid URL format if provided
            },
            comment: 'URL to team profile picture or logo'
        },
        // EXAMPLES: 
        // - "https://company.com/logos/frontend-team.png"
        // - "https://cdn.example.com/avatars/marketing-squad.jpg"
        // DATABASE RESULT: avatar VARCHAR(255) COMMENT 'URL to team profile picture or logo'

        color: {
            type: DataTypes.STRING(7),  // For hex color codes #FFFFFF
            allowNull: true,
            validate: {
                is: /^#[0-9A-F]{6}$/i  // Valid hex color
            },
            comment: 'Team theme color in hex format'
        },

        // Foreign Key
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },

        // Metadata
        maxMembers: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            validate: {
                min: 1,
                max: 1000
            }
        }

    }, {
        sequelize,
        modelName: 'Team',
        tableName: 'teams',
        timestamps: true,  // Adds createdAt, updatedAt
        paranoid: false,   // Set to true for soft deletes
        
        // Add indexes for better performance
        indexes: [
            {
                fields: ['createdBy']
            },
            {
                fields: ['status']
            },
            {
                fields: ['name'],
                unique: false
            }
        ]
    });

    return Team;
};