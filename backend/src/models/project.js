// Import the Model class from Sequelize
// Model is the base class that all our database models will extend from
// It provides methods like findAll(), create(), update(), destroy() etc.
const { Model, Op } = require('sequelize');

// Export a function that takes sequelize connection and DataTypes
// This pattern allows the index.js file to pass these parameters when loading models
// sequelize = database connection instance
// DataTypes = object containing all Sequelize data types (STRING, INTEGER, BOOLEAN, etc.)
module.exports = (sequelize, DataTypes) => {
    
    // Define Project class that extends Sequelize's Model class
    // This gives us access to all database methods like findAll(), create(), etc.
    // Think of this as creating a blueprint for the 'projects' table
    class Project extends Model {
        
        // Static method to define relationships between this model and other models
        // 'static' means this method belongs to the class itself, not individual instances
        // This is called automatically by index.js after all models are loaded
        static associate(models) {
            
            // RELATIONSHIP 1: Project belongs to one Team
            // Each project belongs to exactly one team
            // This creates a foreign key 'teamId' in the projects table
            Project.belongsTo(models.Team, {
                foreignKey: 'teamId',       // Column name in projects table that references teams.id
                as: 'team'                  // Alias to use in queries: project.getTeam()
            });
            // Usage: const project = await Project.findByPk(1, { include: { model: Team, as: 'team' } });

            // RELATIONSHIP 2: Project belongs to one User (creator)
            // Each project has one creator (the user who created it)
            // This creates a foreign key 'createdBy' in the projects table
            Project.belongsTo(models.User, {
                foreignKey: 'createdBy',    // Column name in projects table that references users.id
                as: 'creator'               // Alias to use in queries: project.getCreator()
            });
            // Usage: const project = await Project.findByPk(1, { include: { model: User, as: 'creator' } });

            // RELATIONSHIP 3: Project has many Users (assignees) - Many-to-Many
            // A project can be assigned to multiple users, and users can work on multiple projects
            // This creates a junction table called 'ProjectAssignees' to link projects and users
            Project.belongsToMany(models.User, {
                through: 'ProjectAssignees', // Name of the junction/bridge table
                foreignKey: 'projectId',     // Column in ProjectAssignees that references projects.id
                otherKey: 'userId',          // Column in ProjectAssignees that references users.id
                as: 'assignees'              // Alias: project.getAssignees(), project.addAssignee()
            });
            // Creates table: ProjectAssignees(id, projectId, userId, assignedAt, createdAt, updatedAt)
            // Usage: await project.getAssignees(); await project.addAssignee(userId);

            // RELATIONSHIP 4: Project has many Tasks
            // One project can contain multiple tasks
            // This creates a foreign key 'projectId' in the tasks table
            Project.hasMany(models.Task, {
                foreignKey: 'projectId',    // Column in tasks table that references projects.id
                as: 'tasks'                 // Alias: project.getTasks(), project.createTask()
            });
            // Usage: const tasks = await project.getTasks();

            // RELATIONSHIP 5: Project has many Comments/Updates
            // One project can have multiple status updates or comments
            // This creates a foreign key 'projectId' in the comments table
            Project.hasMany(models.Comment, {
                foreignKey: 'projectId',    // Column in comments table that references projects.id
                as: 'comments'              // Alias: project.getComments(), project.createComment()
            });
            // Usage: const comments = await project.getComments();
        }

        // INSTANCE METHODS - Called on individual project records
        
        // Calculate project completion percentage based on completed tasks
        async getCompletionPercentage() {
            const allTasks = await this.getTasks();
            if (allTasks.length === 0) return 0;
            
            const completedTasks = allTasks.filter(task => task.status === 'completed');
            return Math.round((completedTasks.length / allTasks.length) * 100);
        }

        // Check if project is overdue
        isOverdue() {
            if (!this.endDate) return false;
            return new Date() > new Date(this.endDate) && this.status !== 'completed';
        }

        // Get project duration in days
        getDurationInDays() {
            if (!this.startDate || !this.endDate) return null;
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            const diffTime = Math.abs(end - start);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Check if user is assigned to this project
        async isUserAssigned(userId) {
            const assignees = await this.getAssignees({ where: { id: userId } });
            return assignees.length > 0;
        }

        // STATIC METHODS - Called on the Project model itself
        
        // Get projects by status
        static async getProjectsByStatus(status) {
            return await this.findAll({
                where: { status: status },
                include: [
                    { model: sequelize.models.Team, as: 'team' },
                    { model: sequelize.models.User, as: 'creator' }
                ]
            });
        }

        // Get overdue projects
        static async getOverdueProjects() {
            return await this.findAll({
                where: {
                    endDate: { [Op.lt]: new Date() },
                    status: { [Op.ne]: 'completed' }
                }
            });
        }
    }

    // Initialize the Project model with its attributes (columns) and options
    // This defines what the 'projects' table will look like in the database
    Project.init({
        
        // PROJECT BASIC INFORMATION SECTION
        
        // Project title/name - required field
        title: {
            type: DataTypes.STRING,         // VARCHAR(255) in SQL
            allowNull: false,               // NOT NULL constraint - this field is required
            validate: {                     // Custom validation rules
                len: [3, 200],              // Title must be between 3 and 200 characters
                notEmpty: true              // Cannot be empty string
            }
            // Database: title VARCHAR(255) NOT NULL
        },
        
        // Project description - optional detailed description
        description: {
            type: DataTypes.TEXT,           // TEXT type in SQL (can store long text)
            allowNull: true,                // This field is optional (can be NULL)
            validate: {                     // Custom validation rules
                len: [0, 2000]              // Description can be 0 to 2000 characters
            }
            // Database: description TEXT
        },

        // PROJECT STATUS AND PRIORITY SECTION
        
        // Project status - tracks project lifecycle
        status: {
            type: DataTypes.ENUM('planning', 'active', 'completed', 'on-hold', 'cancelled'),
            allowNull: false,               // Required field
            defaultValue: 'planning',       // New projects start in planning phase
            comment: 'Current status of the project'
            // Database: status ENUM('planning', 'active', 'completed', 'on-hold', 'cancelled') DEFAULT 'planning'
        },

        // Project priority level
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,               // Required field
            defaultValue: 'medium',         // Default priority is medium
            comment: 'Priority level of the project'
            // Database: priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium'
        },

        // PROJECT TIMELINE SECTION
        
        // When the project is scheduled to start
        startDate: {
            type: DataTypes.DATEONLY,       // DATE type in SQL (YYYY-MM-DD format, no time)
            allowNull: true,                // Optional - some projects might not have set start date
            validate: {                     // Custom validation
                isDate: true,               // Must be a valid date
                isAfter: '2020-01-01'       // Must be after 2020 (business rule)
            }
            // Database: startDate DATE
        },
        
        // When the project is scheduled to end
        endDate: {
            type: DataTypes.DATEONLY,       // DATE type in SQL (YYYY-MM-DD format, no time)
            allowNull: true,                // Optional - some projects might be open-ended
            validate: {                     // Custom validation
                isDate: true,               // Must be a valid date
                isAfterStartDate(value) {   // Custom validator function
                    if (value && this.startDate && value < this.startDate) {
                        throw new Error('End date must be after start date');
                    }
                }
            }
            // Database: endDate DATE
        },

        // FOREIGN KEY SECTION
        
        // Reference to the team this project belongs to
        teamId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required - every project must belong to a team
            references: {                   // Foreign key constraint
                model: 'teams',             // References the 'teams' table
                key: 'id'                   // References the 'id' column in teams table
            }
            // Database: teamId INT NOT NULL, FOREIGN KEY (teamId) REFERENCES teams(id)
        },
        
        // Reference to the user who created this project
        createdBy: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required - every project must have a creator
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            }
            // Database: createdBy INT NOT NULL, FOREIGN KEY (createdBy) REFERENCES users(id)
        },

        // PROJECT METADATA SECTION
        
        // Budget allocated for this project (optional)
        budget: {
            type: DataTypes.DECIMAL(10, 2), // DECIMAL(10,2) - up to 8 digits before decimal, 2 after
            allowNull: true,                // Optional field
            validate: {                     // Validation rules
                min: 0                      // Budget cannot be negative
            },
            comment: 'Budget allocated for the project'
            // Database: budget DECIMAL(10,2) COMMENT 'Budget allocated for the project'
        },
        
        // Estimated hours to complete the project
        estimatedHours: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional field
            validate: {                     // Validation rules
                min: 0,                     // Cannot be negative
                max: 10000                  // Maximum 10,000 hours (business rule)
            },
            comment: 'Estimated hours to complete the project'
            // Database: estimatedHours INT COMMENT 'Estimated hours to complete the project'
        },

        // Actual hours spent on the project (tracked)
        actualHours: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional field
            defaultValue: 0,                // Starts at 0 hours
            validate: {                     // Validation rules
                min: 0                      // Cannot be negative
            },
            comment: 'Actual hours spent on the project'
            // Database: actualHours INT DEFAULT 0 COMMENT 'Actual hours spent on the project'
        },

        // Progress percentage (0-100)
        progress: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required field
            defaultValue: 0,                // New projects start at 0% progress
            validate: {                     // Validation rules
                min: 0,                     // Cannot be less than 0%
                max: 100                    // Cannot be more than 100%
            },
            comment: 'Project completion percentage (0-100)'
            // Database: progress INT DEFAULT 0 COMMENT 'Project completion percentage (0-100)'
        }

        // NOTE: Sequelize automatically adds these columns unless disabled:
        // - id: Primary key (auto-increment integer)
        // - createdAt: When project was created
        // - updatedAt: When project was last modified

    }, {
        // MODEL CONFIGURATION OPTIONS
        
        sequelize,                          // Pass the database connection instance
        modelName: 'Project',               // Model name (used internally by Sequelize)
        tableName: 'projects',              // Actual table name in database (lowercase plural)
        timestamps: true,                   // Automatically add createdAt and updatedAt columns
        paranoid: false,                    // Set to true for soft deletes (adds deletedAt column)
        
        // DATABASE INDEXES for better query performance
        // Indexes make database queries faster by creating shortcuts to find data
        indexes: [
            {
                fields: ['teamId']          // Index on teamId for faster lookup of projects by team
            },
            {
                fields: ['createdBy']       // Index on createdBy for faster lookup of projects by creator
            },
            {
                fields: ['status']          // Index on status for faster filtering by project status
            },
            {
                fields: ['priority']        // Index on priority for faster filtering by priority
            },
            {
                fields: ['startDate']       // Index on startDate for faster date-based queries
            },
            {
                fields: ['endDate']         // Index on endDate for faster date-based queries
            },
            {
                fields: ['title'],          // Index on title for faster searching by project name
                unique: false               // Not unique (multiple projects can have similar titles)
            }
        ],
        // SQL equivalent: 
        // CREATE INDEX idx_projects_teamId ON projects(teamId);
        // CREATE INDEX idx_projects_createdBy ON projects(createdBy);
        // CREATE INDEX idx_projects_status ON projects(status);
        // etc.

        // DEFAULT SCOPE - what gets selected by default in queries
        defaultScope: {
            attributes: { exclude: [] }     // Include all attributes by default
        },
        
        // NAMED SCOPES for common queries
        // Scopes are predefined query conditions that can be reused
        scopes: {
            // Scope to get only active projects
            active: {
                where: {
                    status: 'active'
                }
            },
            // Scope to get projects with high priority
            highPriority: {
                where: {
                    priority: ['high', 'critical']
                }
            },
            // Scope to get projects with their team and creator information
            withRelations: {
                include: [
                    {
                        model: sequelize.models.Team,
                        as: 'team',
                        attributes: ['id', 'name', 'avatar']
                    },
                    {
                        model: sequelize.models.User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            },
            // Scope to get overdue projects
            overdue: {
                where: {
                    endDate: { [Op.lt]: new Date() },
                    status: { [Op.notIn]: ['completed', 'cancelled'] }
                }
            }
        },

        // HOOKS - Automatically called during lifecycle events
        hooks: {
            // Before creating a project
            beforeCreate: async (project, options) => {
                // Auto-generate project code if not provided
                if (!project.code) {
                    project.code = project.title.substring(0, 3).toUpperCase() + Date.now();
                }
            },

            // After creating a project
            afterCreate: async (project, options) => {
                // Log project creation
                console.log(`Project "${project.title}" created successfully`);
                
                // You could also create a notification here
                // await Notification.create({
                //     userId: project.createdBy,
                //     type: 'project_created',
                //     message: `Project "${project.title}" has been created`
                // });
            },

            // Before updating a project
            beforeUpdate: async (project, options) => {
                // Update progress based on completed tasks if not manually set
                if (!project.changed('progress')) {
                    const completionPercentage = await project.getCompletionPercentage();
                    project.progress = completionPercentage;
                }
            }
        }
    });

    // Return the Project model so it can be used by index.js and throughout the application
    // This makes the model available as: const { Project } = require('../models');
    return Project;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('planning', 'active', 'completed', 'on-hold', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    startDate DATE,
    endDate DATE,
    teamId INT NOT NULL,
    createdBy INT NOT NULL,
    budget DECIMAL(10,2) COMMENT 'Budget allocated for the project',
    estimatedHours INT COMMENT 'Estimated hours to complete the project',
    actualHours INT DEFAULT 0 COMMENT 'Actual hours spent on the project',
    progress INT DEFAULT 0 COMMENT 'Project completion percentage (0-100)',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (teamId) REFERENCES teams(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    INDEX idx_projects_teamId (teamId),
    INDEX idx_projects_createdBy (createdBy),
    INDEX idx_projects_status (status),
    INDEX idx_projects_priority (priority),
    INDEX idx_projects_startDate (startDate),
    INDEX idx_projects_endDate (endDate),
    INDEX idx_projects_title (title)
);

JUNCTION TABLE FOR MANY-TO-MANY RELATIONSHIP WITH USERS:
CREATE TABLE ProjectAssignees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    projectId INT NOT NULL,
    userId INT NOT NULL,
    assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_user (projectId, userId)
);

HOW TO USE THIS MODEL:

// Create a new project
const project = await Project.create({
    title: 'Mobile App Development',
    description: 'Develop a new mobile application',
    teamId: 1,
    createdBy: 1,
    priority: 'high',
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    estimatedHours: 500
});

// Find all projects with relationships
const projects = await Project.findAll({
    include: [
        { model: Team, as: 'team' },
        { model: User, as: 'creator' },
        { model: User, as: 'assignees' }
    ]
});

// Use scopes
const activeProjects = await Project.scope('active').findAll();
const highPriorityProjects = await Project.scope('highPriority').findAll();
const projectsWithRelations = await Project.scope('withRelations').findAll();

// Use instance methods
const completionPercentage = await project.getCompletionPercentage();
const isOverdue = project.isOverdue();
const duration = project.getDurationInDays();

// Add assignee to project
await project.addAssignee(userId);

// Get project assignees
const assignees = await project.getAssignees();

// Update project
await project.update({ 
    status: 'active', 
    progress: 25 
});

// Delete project
await project.destroy();
*/