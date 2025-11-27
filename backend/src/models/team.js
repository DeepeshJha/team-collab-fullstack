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

            // RELATIONSHIP: Team belongs to User (who updated it)
            Team.belongsTo(models.User, {
                foreignKey: 'updatedBy',
                as: 'updater'  // Alias for queries: team.getUpdater()
            });
            
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

        /*
        INSTANCE METHODS
        Methods called on individual team instances
        */

        // Check if user is team creator/owner
        isCreator(userId) {
            return this.createdBy === userId;
        }

        // Check if user is team member
        async isMember(userId) {
            const member = await this.getMembers({ where: { id: userId } });
            return member.length > 0;
        }

        // Add a new member to the team
        async addNewMember(userId, role = 'member') {
            // Check if already member
            const isMember = await this.isMember(userId);
            if (isMember) {
                throw new Error('User is already a member of this team');
            }

            // Check team capacity
            if (this.memberCount >= this.maxMembers) {
                throw new Error('Team has reached maximum member limit');
            }

            // Add member
            await this.addMember(userId, { through: { role: role } });

            // Update memberCount
            await this.increment('memberCount');

            return { success: true, message: 'Member added successfully' };
        }

        // Remove a member from the team
        async removeMember(userId) {
            const isMember = await this.isMember(userId);
            if (!isMember) {
                throw new Error('User is not a member of this team');
            }

            // Cannot remove creator
            if (this.createdBy === userId) {
                throw new Error('Cannot remove team creator');
            }

            await this.removeMember(userId);
            await this.decrement('memberCount');

            return { success: true, message: 'Member removed successfully' };
        }

        // Get team statistics
        async getStats() {
            const members = await this.countMembers();
            const projects = await this.countProjects();
            const tasks = await this.countTasks();
            const messages = await this.countMessages();

            return {
                membersCount: members,
                projectsCount: projects,
                tasksCount: tasks,
                messagesCount: messages,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            };
        }

        // Generate new invite code
        async refreshInviteCode() {
            const crypto = require('crypto');
            const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            await this.update({ inviteCode: newCode });
            return newCode;
        }

        // Check if invite code is valid
        async validateInviteCode(code) {
            return this.inviteCode === code && this.visibility !== 'hidden';
        }

        // Join team with invite code
        static async joinWithCode(code, userId) {
            const team = await this.findOne({ where: { inviteCode: code } });
            
            if (!team) {
                throw new Error('Invalid invite code');
            }

            if (team.visibility === 'hidden') {
                throw new Error('Cannot join hidden team');
            }

            if (team.memberCount >= team.maxMembers) {
                throw new Error('Team is full');
            }

            const isMember = await team.isMember(userId);
            if (isMember) {
                throw new Error('Already a member of this team');
            }

            await team.addNewMember(userId, 'member');
            return team;
        }

        // Archive the team
        async archive() {
            return await this.update({
                status: 'archived',
                visibility: 'hidden'
            });
        }

        // Deactivate the team temporarily
        async deactivate() {
            return await this.update({ status: 'inactive' });
        }

        // Reactivate the team
        async reactivate() {
            return await this.update({ status: 'active' });
        }

        // Get active projects count
        async getActiveProjectsCount() {
            const { sequelize } = require('sequelize');
            const Op = require('sequelize').Op;
            
            return await this.countProjects({
                where: { status: 'active' }
            });
        }

        // Get pending tasks count
        async getPendingTasksCount() {
            const { Op } = require('sequelize');
            return await this.countTasks({
                where: { status: { [Op.notIn]: ['completed', 'cancelled'] } }
            });
        }

        // Get team details with relations
        // Returns comprehensive team info including creator, updater, members, and stats
        async getFullDetails() {
            const creator = await this.getCreator();           // Get user who created the team
            const updater = await this.getUpdater();           // Get user who last updated the team
            const members = await this.getMembers({ attributes: ['id', 'name', 'email', 'avatar'] });
            const stats = await this.getStats();

            return {
                id: this.id,
                name: this.name,
                description: this.description,
                descriptionRich: this.descriptionRich,
                avatar: this.avatar,
                coverImage: this.coverImage,
                icon: this.icon,
                color: this.color,
                status: this.status,
                visibility: this.visibility,
                department: this.department,
                tags: this.tags,
                creator: creator,                   // User object who created this team
                updater: updater,                   // User object who last modified this team
                members: members,                   // Array of team members
                stats: stats,                       // Team statistics (counts, timestamps)
                settings: this.settings
            };
        }

        // Update team settings
        async updateSettings(newSettings) {
            const updated = {
                ...this.settings,
                ...newSettings
            };
            return await this.update({ settings: updated });
        }

        /*
        STATIC METHODS
        Called on the Team model itself
        */

        // Get all active teams
        static async getActiveTeams() {
            return await this.findAll({
                where: { status: 'active' },
                order: [['createdAt', 'DESC']]
            });
        }

        // Get public teams
        static async getPublicTeams() {
            return await this.findAll({
                where: { visibility: 'public' },
                attributes: ['id', 'name', 'description', 'avatar', 'icon', 'department', 'memberCount'],
                order: [['memberCount', 'DESC']]
            });
        }

        // Get teams by user (teams user is member of or creator of)
        static async getTeamsByUser(userId) {
            return await this.findAll({
                include: [{
                    model: sequelize.models.User,
                    where: { id: userId },
                    through: { attributes: [] },
                    as: 'members'
                }],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get teams created by user
        static async getTeamsByCreator(userId) {
            return await this.findAll({
                where: { createdBy: userId },
                order: [['createdAt', 'DESC']]
            });
        }

        // Get teams by department
        static async getTeamsByDepartment(department) {
            return await this.findAll({
                where: { department: department, status: 'active' },
                order: [['name', 'ASC']]
            });
        }

        // Search teams by name or tags
        static async searchTeams(query) {
            const Op = require('sequelize').Op;
            return await this.findAll({
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${query}%` } },
                        { description: { [Op.like]: `%${query}%` } }
                    ],
                    visibility: { [Op.notIn]: ['hidden'] }
                },
                order: [['memberCount', 'DESC']],
                limit: 10
            });
        }

        // Get trending teams (most active)
        static async getTrendingTeams(limit = 5) {
            return await this.findAll({
                where: { status: 'active', visibility: 'public' },
                order: [['memberCount', 'DESC']],
                limit: limit
            });
        }

        // Create team with initial member
        static async createTeam(teamData, creatorId) {
            const crypto = require('crypto');
            const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

            const team = await this.create({
                ...teamData,
                createdBy: creatorId,
                inviteCode: inviteCode,
                memberCount: 1,
                activeMembersCount: 1
            });

            // Add creator as member
            await team.addMember(creatorId, { through: { role: 'admin' } });

            return team;
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
        PRIMARY KEY SECTION
        Every database table needs a unique identifier
        */
        
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique team identifier'
        },
        // DATABASE RESULT: id INT PRIMARY KEY AUTO_INCREMENT NOT NULL

        /*
        TEAM BASIC INFORMATION SECTION
        Core details that identify and describe the team
        */
        
        // TEAM NAME - What the team is called
        // EXAMPLES: "Frontend Development", "Marketing Squad", "Design Team"
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [3, 100],
                notEmpty: true
            },
            comment: 'Team display name - what users see'
        },

        // TEAM DESCRIPTION - What the team does
        // EXAMPLES: "Responsible for all frontend development and user experience"
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 500]
            },
            comment: 'Optional description explaining team purpose and responsibilities'
        },

        descriptionRich: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Team description in markdown format with rich formatting'
        },

        /*
        TEAM IDENTIFICATION SECTION
        Unique codes and identifiers for team discovery and invitations
        */

        inviteCode: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false,
            comment: 'Unique code for team invitations (e.g., ABC123XYZ)'
        },

        /*
        TEAM SETTINGS SECTION
        Configuration options that control team behavior
        */

        // TEAM PRIVACY - Who can see and join the team
        isPrivate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether team is private (invite-only) or public (anyone can join)'
        },

        visibility: {
            type: DataTypes.ENUM('public', 'private', 'hidden'),
            defaultValue: 'private',
            comment: 'public (listed in directory), private (unlisted), hidden (invisible)'
        },

        // TEAM STATUS - Current state of the team
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'archived'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Team status: active (working), inactive (paused), archived (completed/disbanded)'
        },

        /*
        TEAM BRANDING SECTION
        Visual identity and customization options
        */
        
        // TEAM AVATAR - Team profile picture/logo
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: 'URL to team profile picture or logo'
        },

        coverImage: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: 'URL to team cover/header image'
        },

        icon: {
            type: DataTypes.STRING(10),
            defaultValue: '👥',
            comment: 'Team emoji icon for quick visual identification'
        },

        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            validate: {
                is: /^#[0-9A-F]{6}$/i
            },
            comment: 'Team theme color in hex format (#FFFFFF)'
        },

        /*
        TEAM CATEGORIZATION SECTION
        Classification and tagging for organization
        */

        department: {
            type: DataTypes.ENUM('engineering', 'marketing', 'design', 'sales', 'hr', 'other'),
            allowNull: true,
            comment: 'Team department or category'
        },

        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of tags for organization and search (e.g., ["frontend", "web", "react"])'
        },

        /*
        TEAM CONFIGURATION SECTION
        Flexible JSON settings for team behavior
        */

        settings: {
            type: DataTypes.JSON,
            defaultValue: {
                allowPublicJoin: false,
                requireApproval: false,
                allowGuestAccess: false,
                notifyOnNewMember: true,
                allowExternalIntegrations: false
            },
            comment: 'Team configuration settings stored as JSON'
        },

        /*
        TEAM CONSTRAINTS SECTION
        Rules and limitations for team membership
        */

        // Foreign Key - Creator
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'User ID of team creator/owner'
        },

        // ✅ ADD THIS - Foreign Key - Last Updater
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'User ID of who last updated the team'
        },

        maxMembers: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            validate: {
                min: 1,
                max: 10000
            },
            comment: 'Maximum number of team members allowed'
        },

        minMemberRole: {
            type: DataTypes.ENUM('admin', 'member', 'viewer'),
            defaultValue: 'viewer',
            comment: 'Minimum role required to join team'
        },

        /*
        TEAM METRICS SECTION
        Cached counters for performance optimization
        */

        memberCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Cached member count for performance (updated when members added/removed)'
        },

        activeMembersCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Count of recently active members'
        },

        projectsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Cached count of team projects'
        },

        tasksCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Cached count of team tasks'
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