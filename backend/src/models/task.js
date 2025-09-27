// Import the Model class from Sequelize
// Model is the base class that all our database models will extend from
// It provides methods like findAll(), create(), update(), destroy() etc.
const { Model, Op } = require('sequelize');

// Export a function that takes sequelize connection and DataTypes
// This pattern allows the index.js file to pass these parameters when loading models
// sequelize = database connection instance
// DataTypes = object containing all Sequelize data types (STRING, INTEGER, BOOLEAN, etc.)
module.exports = (sequelize, DataTypes) => {
    
    // Define Task class that extends Sequelize's Model class
    // This gives us access to all database methods like findAll(), create(), etc.
    // Think of this as creating a blueprint for the 'tasks' table
    class Task extends Model {
        
        // Static method to define relationships between this model and other models
        // 'static' means this method belongs to the class itself, not individual instances
        // This is called automatically by index.js after all models are loaded
        static associate(models) {
            
            // RELATIONSHIP 1: Task belongs to one Project
            // Each task belongs to exactly one project
            // This creates a foreign key 'projectId' in the tasks table
            Task.belongsTo(models.Project, {
                foreignKey: 'projectId',    // Column name in tasks table that references projects.id
                as: 'project'               // Alias to use in queries: task.getProject()
            });
            // Usage: const task = await Task.findByPk(1, { include: { model: Project, as: 'project' } });

            // RELATIONSHIP 2: Task belongs to one User (assignee)
            // Each task is assigned to one user (who will work on it)
            // This creates a foreign key 'assignedTo' in the tasks table
            Task.belongsTo(models.User, {
                foreignKey: 'assignedTo',   // Column name in tasks table that references users.id
                as: 'assignee'              // Alias to use in queries: task.getAssignee()
            });
            // Usage: const task = await Task.findByPk(1, { include: { model: User, as: 'assignee' } });

            // RELATIONSHIP 3: Task belongs to one User (creator)
            // Each task has one creator (the user who created it)
            // This creates a foreign key 'createdBy' in the tasks table
            Task.belongsTo(models.User, {
                foreignKey: 'createdBy',    // Column name in tasks table that references users.id
                as: 'creator'               // Alias to use in queries: task.getCreator()
            });
            // Usage: const task = await Task.findByPk(1, { include: { model: User, as: 'creator' } });

            // RELATIONSHIP 4: Task has many Comments
            // One task can have multiple comments/updates
            // This creates a foreign key 'taskId' in the comments table
            Task.hasMany(models.Comment, {
                foreignKey: 'taskId',       // Column in comments table that references tasks.id
                as: 'comments'              // Alias: task.getComments(), task.createComment()
            });
            // Usage: const comments = await task.getComments();

            // RELATIONSHIP 5: Task has many Attachments
            // One task can have multiple file attachments
            // This creates a foreign key 'taskId' in the attachments table
            Task.hasMany(models.Attachment, {
                foreignKey: 'taskId',       // Column in attachments table that references tasks.id
                as: 'attachments'           // Alias: task.getAttachments(), task.createAttachment()
            });
            // Usage: const attachments = await task.getAttachments();

            // RELATIONSHIP 6: Task has many Reactions
            // One task can have multiple emoji reactions from different users
            // EXAMPLE: 🎉 for task completion, 🔥 for urgent tasks, ✅ for approval
            // DATABASE: Creates foreign key 'taskId' in reactions table
            Task.hasMany(models.Reaction, {
                foreignKey: 'taskId',       // Column in reactions table that references tasks.id
                as: 'reactions'             // Alias: task.getReactions(), task.createReaction()
            });
            // Usage: const reactions = await task.getReactions();

            // RELATIONSHIP 7: Task belongs to one Team (optional direct relationship)
            // Tasks can optionally belong directly to a team (for team-level tasks)
            Task.belongsTo(models.Team, {
                foreignKey: 'teamId',       // Column name in tasks table that references teams.id
                as: 'team'                  // Alias to use in queries: task.getTeam()
            });
            // Usage: const task = await Task.findByPk(1, { include: { model: Team, as: 'team' } });
        }

        // INSTANCE METHODS - Called on individual task records
        
        // Check if task is overdue
        isOverdue() {
            if (!this.dueDate) return false;
            return new Date() > new Date(this.dueDate) && !['completed', 'cancelled'].includes(this.status);
        }

        // Get days until due date
        getDaysUntilDue() {
            if (!this.dueDate) return null;
            const today = new Date();
            const due = new Date(this.dueDate);
            const diffTime = due - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Calculate task completion time
        getCompletionTime() {
            if (this.status !== 'completed' || !this.completedAt) return null;
            const created = new Date(this.createdAt);
            const completed = new Date(this.completedAt);
            const diffTime = Math.abs(completed - created);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Return in days
        }

        // Check if user can edit this task
        canUserEdit(userId) {
            return this.createdBy === userId || this.assignedTo === userId;
        }

        // Mark task as completed
        async markCompleted(userId) {
            return await this.update({
                status: 'completed',
                completedAt: new Date(),
                completedBy: userId
            });
        }

        // Update task progress
        async updateProgress(progress) {
            let status = this.status;
            
            // Auto-update status based on progress
            if (progress === 0) status = 'todo';
            else if (progress > 0 && progress < 100) status = 'in-progress';
            else if (progress === 100) status = 'completed';

            return await this.update({
                progress: progress,
                status: status,
                completedAt: progress === 100 ? new Date() : null
            });
        }

        // STATIC METHODS - Called on the Task model itself
        
        // Get tasks by status
        static async getTasksByStatus(status) {
            return await this.findAll({
                where: { status: status },
                include: [
                    { model: sequelize.models.Project, as: 'project' },
                    { model: sequelize.models.User, as: 'assignee' },
                    { model: sequelize.models.User, as: 'creator' }
                ]
            });
        }

        // Get overdue tasks
        static async getOverdueTasks() {
            return await this.findAll({
                where: {
                    dueDate: { [Op.lt]: new Date() },
                    status: { [Op.notIn]: ['completed', 'cancelled'] }
                },
                include: [
                    { model: sequelize.models.User, as: 'assignee' },
                    { model: sequelize.models.Project, as: 'project' }
                ]
            });
        }

        // Get tasks assigned to a specific user
        static async getTasksByUser(userId) {
            return await this.findAll({
                where: { assignedTo: userId },
                include: [
                    { model: sequelize.models.Project, as: 'project' },
                    { model: sequelize.models.Team, as: 'team' }
                ]
            });
        }

        // Get high priority tasks
        static async getHighPriorityTasks() {
            return await this.findAll({
                where: { 
                    priority: ['high', 'critical'],
                    status: { [Op.notIn]: ['completed', 'cancelled'] }
                },
                order: [['priority', 'DESC'], ['dueDate', 'ASC']]
            });
        }
    }

    // Initialize the Task model with its attributes (columns) and options
    // This defines what the 'tasks' table will look like in the database
    Task.init({
        
        // TASK BASIC INFORMATION SECTION
        
        // Task title/name - required field
        title: {
            type: DataTypes.STRING,         // VARCHAR(255) in SQL
            allowNull: false,               // NOT NULL constraint - this field is required
            validate: {                     // Custom validation rules
                len: [3, 200],              // Title must be between 3 and 200 characters
                notEmpty: true              // Cannot be empty string
            }
            // Database: title VARCHAR(255) NOT NULL
        },
        
        // Task description - optional detailed description
        description: {
            type: DataTypes.TEXT,           // TEXT type in SQL (can store long text)
            allowNull: true,                // This field is optional (can be NULL)
            validate: {                     // Custom validation rules
                len: [0, 1000]              // Description can be 0 to 1000 characters
            }
            // Database: description TEXT
        },

        // TASK STATUS AND PRIORITY SECTION
        
        // Task status - tracks task lifecycle
        status: {
            type: DataTypes.ENUM('todo', 'in-progress', 'review', 'completed', 'cancelled'),
            allowNull: false,               // Required field
            defaultValue: 'todo',           // New tasks start as todo
            comment: 'Current status of the task'
            // Database: status ENUM('todo', 'in-progress', 'review', 'completed', 'cancelled') DEFAULT 'todo'
        },

        // Task priority level
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,               // Required field
            defaultValue: 'medium',         // Default priority is medium
            comment: 'Priority level of the task'
            // Database: priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium'
        },

        // TASK TIMELINE SECTION
        
        // When the task is due
        dueDate: {
            type: DataTypes.DATE,           // DATETIME type in SQL (includes time)
            allowNull: true,                // Optional - not all tasks have due dates
            validate: {                     // Custom validation
                isDate: true,               // Must be a valid date
                isAfter: new Date().toISOString() // Due date should be in the future (for new tasks)
            }
            // Database: dueDate DATETIME
        },
        
        // When the task was completed
        completedAt: {
            type: DataTypes.DATE,           // DATETIME type in SQL
            allowNull: true,                // Optional - only set when task is completed
            comment: 'When the task was marked as completed'
            // Database: completedAt DATETIME COMMENT 'When the task was marked as completed'
        },

        // FOREIGN KEY SECTION
        
        // Reference to the project this task belongs to
        projectId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional - tasks can exist without projects (team-level tasks)
            references: {                   // Foreign key constraint
                model: 'projects',          // References the 'projects' table
                key: 'id'                   // References the 'id' column in projects table
            }
            // Database: projectId INT, FOREIGN KEY (projectId) REFERENCES projects(id)
        },

        // Reference to the team this task belongs to (for team-level tasks)
        teamId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional - tasks can belong to projects instead
            references: {                   // Foreign key constraint
                model: 'teams',             // References the 'teams' table
                key: 'id'                   // References the 'id' column in teams table
            }
            // Database: teamId INT, FOREIGN KEY (teamId) REFERENCES teams(id)
        },
        
        // Reference to the user this task is assigned to
        assignedTo: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional - tasks can be unassigned
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            }
            // Database: assignedTo INT, FOREIGN KEY (assignedTo) REFERENCES users(id)
        },
        
        // Reference to the user who created this task
        createdBy: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required - every task must have a creator
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            }
            // Database: createdBy INT NOT NULL, FOREIGN KEY (createdBy) REFERENCES users(id)
        },

        // Reference to the user who completed this task
        completedBy: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional - only set when task is completed
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            }
            // Database: completedBy INT, FOREIGN KEY (completedBy) REFERENCES users(id)
        },

        // TASK METADATA SECTION
        
        // Estimated hours to complete this task
        estimatedHours: {
            type: DataTypes.DECIMAL(5, 2),  // DECIMAL(5,2) - up to 3 digits before decimal, 2 after (999.99)
            allowNull: true,                // Optional field
            validate: {                     // Validation rules
                min: 0                      // Cannot be negative
            },
            comment: 'Estimated hours to complete the task'
            // Database: estimatedHours DECIMAL(5,2) COMMENT 'Estimated hours to complete the task'
        },
        
        // Actual hours spent on this task
        actualHours: {
            type: DataTypes.DECIMAL(5, 2),  // DECIMAL(5,2) - up to 3 digits before decimal, 2 after
            allowNull: true,                // Optional field
            defaultValue: 0,                // Starts at 0 hours
            validate: {                     // Validation rules
                min: 0                      // Cannot be negative
            },
            comment: 'Actual hours spent on the task'
            // Database: actualHours DECIMAL(5,2) DEFAULT 0 COMMENT 'Actual hours spent on the task'
        },

        // Task progress percentage (0-100)
        progress: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required field
            defaultValue: 0,                // New tasks start at 0% progress
            validate: {                     // Validation rules
                min: 0,                     // Cannot be less than 0%
                max: 100                    // Cannot be more than 100%
            },
            comment: 'Task completion percentage (0-100)'
            // Database: progress INT DEFAULT 0 COMMENT 'Task completion percentage (0-100)'
        },

        // Task position/order in a list (for Kanban boards)
        position: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional field
            defaultValue: 0,                // Default position
            comment: 'Position of task in list for ordering'
            // Database: position INT DEFAULT 0 COMMENT 'Position of task in list for ordering'
        },

        // Labels/tags for categorizing tasks (stored as JSON array)
        tags: {
            type: DataTypes.JSON,           // JSON type - stores array of strings
            allowNull: true,                // Optional field
            defaultValue: [],               // Empty array by default
            comment: 'Tags/labels for categorizing the task'
            // Database: tags JSON COMMENT 'Tags/labels for categorizing the task'
            // Example: ['frontend', 'urgent', 'bug-fix']
        }

        // NOTE: Sequelize automatically adds these columns unless disabled:
        // - id: Primary key (auto-increment integer)
        // - createdAt: When task was created
        // - updatedAt: When task was last modified

    }, {
        // MODEL CONFIGURATION OPTIONS
        
        sequelize,                          // Pass the database connection instance
        modelName: 'Task',                  // Model name (used internally by Sequelize)
        tableName: 'tasks',                 // Actual table name in database (lowercase plural)
        timestamps: true,                   // Automatically add createdAt and updatedAt columns
        paranoid: false,                    // Set to true for soft deletes (adds deletedAt column)
        
        // DATABASE INDEXES for better query performance
        // Indexes make database queries faster by creating shortcuts to find data
        indexes: [
            {
                fields: ['projectId']       // Index on projectId for faster lookup of tasks by project
            },
            {
                fields: ['teamId']          // Index on teamId for faster lookup of tasks by team
            },
            {
                fields: ['assignedTo']      // Index on assignedTo for faster lookup of tasks by assignee
            },
            {
                fields: ['createdBy']       // Index on createdBy for faster lookup of tasks by creator
            },
            {
                fields: ['status']          // Index on status for faster filtering by task status
            },
            {
                fields: ['priority']        // Index on priority for faster filtering by priority
            },
            {
                fields: ['dueDate']         // Index on dueDate for faster date-based queries
            },
            {
                fields: ['title'],          // Index on title for faster searching by task name
                unique: false               // Not unique (multiple tasks can have similar titles)
            },
            {
                fields: ['status', 'assignedTo'] // Compound index for common query patterns
            }
        ],
        // SQL equivalent: 
        // CREATE INDEX idx_tasks_projectId ON tasks(projectId);
        // CREATE INDEX idx_tasks_assignedTo ON tasks(assignedTo);
        // etc.

        // DEFAULT SCOPE - what gets selected by default in queries
        defaultScope: {
            attributes: { exclude: [] }     // Include all attributes by default
        },
        
        // NAMED SCOPES for common queries
        // Scopes are predefined query conditions that can be reused
        scopes: {
            // Scope to get only active tasks (not completed or cancelled)
            active: {
                where: {
                    status: { [Op.notIn]: ['completed', 'cancelled'] }
                }
            },
            // Scope to get tasks with high priority
            highPriority: {
                where: {
                    priority: ['high', 'critical']
                }
            },
            // Scope to get overdue tasks
            overdue: {
                where: {
                    dueDate: { [Op.lt]: new Date() },
                    status: { [Op.notIn]: ['completed', 'cancelled'] }
                }
            },
            // Scope to get tasks assigned to current user
            myTasks: (userId) => ({
                where: {
                    assignedTo: userId
                }
            }),
            // Scope to get tasks with their relationships
            withRelations: {
                include: [
                    {
                        model: sequelize.models.Project,
                        as: 'project',
                        attributes: ['id', 'title', 'status']
                    },
                    {
                        model: sequelize.models.User,
                        as: 'assignee',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: sequelize.models.User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            }
        },

        // HOOKS - Automatically called during lifecycle events
        hooks: {
            // Before creating a task
            beforeCreate: async (task, options) => {
                // Auto-set teamId if task belongs to a project
                if (task.projectId && !task.teamId) {
                    const project = await sequelize.models.Project.findByPk(task.projectId);
                    if (project) {
                        task.teamId = project.teamId;
                    }
                }
            },

            // After creating a task
            afterCreate: async (task, options) => {
                // Log task creation
                console.log(`Task "${task.title}" created successfully`);
                
                // Create notification for assignee if task is assigned
                if (task.assignedTo) {
                    // await Notification.create({
                    //     userId: task.assignedTo,
                    //     type: 'task_assigned',
                    //     message: `You have been assigned task: "${task.title}"`
                    // });
                }
            },

            // Before updating a task
            beforeUpdate: async (task, options) => {
                // Auto-set completedAt when status becomes completed
                if (task.changed('status') && task.status === 'completed' && !task.completedAt) {
                    task.completedAt = new Date();
                }
                
                // Auto-set progress when status changes
                if (task.changed('status')) {
                    switch (task.status) {
                        case 'todo':
                            task.progress = 0;
                            break;
                        case 'in-progress':
                            if (task.progress === 0) task.progress = 25;
                            break;
                        case 'review':
                            if (task.progress < 90) task.progress = 90;
                            break;
                        case 'completed':
                            task.progress = 100;
                            break;
                    }
                }
            },

            // After updating a task
            afterUpdate: async (task, options) => {
                // Send notification if task status changed to completed
                if (task.changed('status') && task.status === 'completed') {
                    console.log(`Task "${task.title}" has been completed`);
                }
            }
        }
    });

    // Return the Task model so it can be used by index.js and throughout the application
    // This makes the model available as: const { Task } = require('../models');
    return Task;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in-progress', 'review', 'completed', 'cancelled') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    dueDate DATETIME,
    completedAt DATETIME COMMENT 'When the task was marked as completed',
    projectId INT,
    teamId INT,
    assignedTo INT,
    createdBy INT NOT NULL,
    completedBy INT,
    estimatedHours DECIMAL(5,2) COMMENT 'Estimated hours to complete the task',
    actualHours DECIMAL(5,2) DEFAULT 0 COMMENT 'Actual hours spent on the task',
    progress INT DEFAULT 0 COMMENT 'Task completion percentage (0-100)',
    position INT DEFAULT 0 COMMENT 'Position of task in list for ordering',
    tags JSON COMMENT 'Tags/labels for categorizing the task',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (projectId) REFERENCES projects(id),
    FOREIGN KEY (teamId) REFERENCES teams(id),
    FOREIGN KEY (assignedTo) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    FOREIGN KEY (completedBy) REFERENCES users(id),
    INDEX idx_tasks_projectId (projectId),
    INDEX idx_tasks_teamId (teamId),
    INDEX idx_tasks_assignedTo (assignedTo),
    INDEX idx_tasks_createdBy (createdBy),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_dueDate (dueDate),
    INDEX idx_tasks_title (title),
    INDEX idx_tasks_status_assignedTo (status, assignedTo)
);

HOW TO USE THIS MODEL:

// Create a new task
const task = await Task.create({
    title: 'Implement user authentication',
    description: 'Add login and registration functionality',
    projectId: 1,
    assignedTo: 2,
    createdBy: 1,
    priority: 'high',
    dueDate: '2024-12-31 23:59:59',
    estimatedHours: 8.5,
    tags: ['frontend', 'authentication', 'security']
});

// Find all tasks with relationships
const tasks = await Task.findAll({
    include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee' },
        { model: User, as: 'creator' }
    ]
});

// Use scopes
const activeTasks = await Task.scope('active').findAll();
const highPriorityTasks = await Task.scope('highPriority').findAll();
const overdueTasks = await Task.scope('overdue').findAll();
const myTasks = await Task.scope('myTasks').call(Task, userId);

// Use instance methods
const isOverdue = task.isOverdue();
const daysUntilDue = task.getDaysUntilDue();
const completionTime = task.getCompletionTime();
const canEdit = task.canUserEdit(userId);

// Update task progress
await task.updateProgress(75);

// Mark task as completed
await task.markCompleted(userId);

// Update task
await task.update({ 
    status: 'in-progress', 
    actualHours: 5.5 
});

// Delete task
await task.destroy();
*/