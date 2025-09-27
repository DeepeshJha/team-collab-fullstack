/*
WHAT IS THE COMMENT MODEL?
The Comment model represents discussions, updates, and notes on tasks and projects.
Think of it like a conversation thread where team members can:
- Ask questions about tasks
- Provide updates on progress
- Share ideas and feedback
- Document decisions and changes

REAL WORLD EXAMPLES:
- "I'm starting work on this task now"
- "The API endpoint is ready for testing"
- "We need to change the approach due to client feedback"
- "Task completed - please review"

KEY FEATURES OF COMMENTS:
- Belongs to a task, project, or team
- Has an author (the user who wrote it)
- Can be edited after creation
- Can mention other users (@username)
- Can include attachments or links
- Tracks when it was created and modified

WHAT DOES THIS FILE DO?
- Defines the structure of the comments table in the database
- Sets up relationships with Task, Project, Team, and User models
- Provides methods to work with comment data
- Handles comment creation, editing, and deletion
*/

// Import the Model class and Op (Operators) from Sequelize
// Model gives us all the database superpowers (create, find, update, delete)
// Op provides query operators like Op.like, Op.gte, etc.
const { Model, Op } = require('sequelize');

// Export a function that receives database connection and data types
// This pattern allows index.js to pass the connection when loading models
module.exports = (sequelize, DataTypes) => {
    
    // Define Comment class that extends Sequelize's Model class
    // This gives us access to methods like Comment.create(), Comment.findAll(), etc.
    class Comment extends Model {
        
        // Static method to define relationships with other models
        // Called automatically after all models are loaded
        static associate(models) {
            
            /*
            COMMENT RELATIONSHIPS EXPLAINED:
            
            Think of comments like sticky notes or chat messages:
            - "Comment belongs to User" = Every comment has one author
            - "Comment belongs to Task" = Comments are attached to specific tasks
            - "Comment belongs to Project" = Comments can be on project level
            - "Comment belongs to Team" = Comments can be general team discussions
            */
            
            // RELATIONSHIP 1: Comment belongs to one User (author)
            // REAL WORLD: Every comment needs someone who wrote it
            // DATABASE: Adds 'userId' column in comments table that references users.id
            Comment.belongsTo(models.User, {
                foreignKey: 'userId',           // Column in comments table storing author's user ID
                as: 'author'                    // Alias for queries: comment.getAuthor()
            });
            // USAGE: const author = await comment.getAuthor();
            // SQL EQUIVALENT: SELECT * FROM users WHERE id = comment.userId;

            // RELATIONSHIP 2: Comment belongs to one Task (optional)
            // REAL WORLD: Comments can be specific to a task
            // EXAMPLE: "This feature is ready for testing"
            // DATABASE: Adds 'taskId' column in comments table
            Comment.belongsTo(models.Task, {
                foreignKey: 'taskId',           // Column in comments table storing task's ID
                as: 'task'                      // Alias for queries: comment.getTask()
            });
            // USAGE: const task = await comment.getTask();

            // RELATIONSHIP 3: Comment belongs to one Project (optional)
            // REAL WORLD: Comments can be about the entire project
            // EXAMPLE: "Project timeline needs to be updated"
            // DATABASE: Adds 'projectId' column in comments table
            Comment.belongsTo(models.Project, {
                foreignKey: 'projectId',        // Column in comments table storing project's ID
                as: 'project'                   // Alias for queries: comment.getProject()
            });
            // USAGE: const project = await comment.getProject();

            // RELATIONSHIP 4: Comment belongs to one Team (optional)
            // REAL WORLD: Comments can be general team discussions
            // EXAMPLE: "Team meeting scheduled for Friday"
            // DATABASE: Adds 'teamId' column in comments table
            Comment.belongsTo(models.Team, {
                foreignKey: 'teamId',           // Column in comments table storing team's ID
                as: 'team'                      // Alias for queries: comment.getTeam()
            });
            // USAGE: const team = await comment.getTeam();

            // RELATIONSHIP 5: Comment belongs to one Comment (parent - for replies)
            // REAL WORLD: Comments can be replies to other comments (thread system)
            // EXAMPLE: Reply to "Task is ready" with "Great! I'll test it now"
            // DATABASE: Adds 'parentId' column in comments table
            Comment.belongsTo(models.Comment, {
                foreignKey: 'parentId',         // Column in comments table that references comments.id
                as: 'parentComment'             // Alias: comment.getParentComment()
            });
            // USAGE: const parentComment = await comment.getParentComment();

            // RELATIONSHIP 6: Comment has many Comments (replies)
            // REAL WORLD: One comment can have multiple replies
            // This is the reverse of the parentComment relationship
            Comment.hasMany(models.Comment, {
                foreignKey: 'parentId',         // Column in comments table that references this comment's id
                as: 'replies'                   // Alias: comment.getReplies()
            });
            // USAGE: const replies = await comment.getReplies();

            // RELATIONSHIP 7: Comment has many Reactions
            // REAL WORLD: One comment can have multiple emoji reactions from different users
            // EXAMPLE: 👍 for agreement, ❤️ for appreciation, 🔥 for excitement
            // DATABASE: Creates foreign key 'commentId' in reactions table
            Comment.hasMany(models.Reaction, {
                foreignKey: 'commentId',        // Column in reactions table that references comments.id
                as: 'reactions'                 // Alias: comment.getReactions(), comment.createReaction()
            });
            // USAGE: const reactions = await comment.getReactions();

            // RELATIONSHIP 8: Comment has many Attachments
            // REAL WORLD: One comment can have multiple file attachments
            // EXAMPLE: Screenshots, diagrams, documents to support the comment
            // DATABASE: Creates foreign key 'commentId' in attachments table
            Comment.hasMany(models.Attachment, {
                foreignKey: 'commentId',        // Column in attachments table that references comments.id
                as: 'attachments'               // Alias: comment.getAttachments(), comment.createAttachment()
            });
            // USAGE: const attachments = await comment.getAttachments();
        }

        /*
        INSTANCE METHODS SECTION
        These are functions you can call on individual comment records
        */

        // Check if comment can be edited (within edit time limit)
        canEdit(userId, timeLimit = 30) { // 30 minutes default
            if (this.userId !== userId) return false;
            if (this.isEdited) return false; // Already edited once (business rule)
            
            const now = new Date();
            const created = new Date(this.createdAt);
            const diffMinutes = (now - created) / (1000 * 60);
            
            return diffMinutes <= timeLimit;
        }

        // Check if comment can be deleted
        canDelete(userId) {
            return this.userId === userId; // Only author can delete
        }

        // Get formatted timestamp for display
        getFormattedTime() {
            const now = new Date();
            const commentTime = new Date(this.createdAt);
            const diffSeconds = (now - commentTime) / 1000;
            
            if (diffSeconds < 60) return 'Just now';
            if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
            if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
            
            return commentTime.toLocaleDateString();
        }

        // Check if comment is a reply
        isReply() {
            return this.parentId !== null;
        }

        // Get reply count
        async getReplyCount() {
            return await this.countReplies();
        }

        // Mark comment as edited
        async markAsEdited() {
            return await this.update({
                isEdited: true,
                editedAt: new Date()
            });
        }

        // Get comment context (what it's attached to)
        getContext() {
            if (this.taskId) return { type: 'task', id: this.taskId };
            if (this.projectId) return { type: 'project', id: this.projectId };
            if (this.teamId) return { type: 'team', id: this.teamId };
            return { type: 'general', id: null };
        }

        /*
        STATIC METHODS SECTION
        These are functions you call on the Comment model itself
        */

        // Get comments for a specific task with pagination
        static async getTaskComments(taskId, offset = 0, limit = 20) {
            return await this.findAndCountAll({
                where: { taskId: taskId, parentId: null }, // Only top-level comments
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    },
                    {
                        model: sequelize.models.Comment,
                        as: 'replies',
                        include: [{ 
                            model: sequelize.models.User, 
                            as: 'author',
                            attributes: ['id', 'name', 'avatar'] 
                        }],
                        order: [['createdAt', 'ASC']]
                    }
                ],
                order: [['createdAt', 'DESC']],
                offset: offset,
                limit: limit
            });
        }

        // Get comments for a specific project
        static async getProjectComments(projectId, limit = 50) {
            return await this.findAll({
                where: { projectId: projectId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limit
            });
        }

        // Get comments for a specific team
        static async getTeamComments(teamId, limit = 50) {
            return await this.findAll({
                where: { teamId: teamId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limit
            });
        }

        // Search comments by content
        static async searchComments(searchTerm, contextType, contextId) {
            const whereCondition = {
                content: { [Op.like]: `%${searchTerm}%` }
            };

            if (contextType && contextId) {
                whereCondition[`${contextType}Id`] = contextId;
            }

            return await this.findAll({
                where: whereCondition,
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get comment thread (comment and all its replies)
        static async getThread(commentId) {
            return await this.findByPk(commentId, {
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    },
                    {
                        model: sequelize.models.Comment,
                        as: 'replies',
                        include: [{ 
                            model: sequelize.models.User, 
                            as: 'author',
                            attributes: ['id', 'name', 'avatar']
                        }],
                        order: [['createdAt', 'ASC']]
                    }
                ]
            });
        }
    }

    // Initialize the Comment model with its attributes (columns) and options
    Comment.init({
        
        /*
        COMMENT CONTENT SECTION
        Core information that makes up the comment
        */
        
        // COMMENT CONTENT - The actual text of the comment
        // EXAMPLES: "Task looks good!", "Need to discuss this approach"
        content: {
            type: DataTypes.TEXT,           // TEXT type - can store long comments
            allowNull: false,               // REQUIRED - every comment must have content
            validate: {                     // VALIDATION RULES
                len: [1, 2000],             // Comment must be between 1 and 2000 characters
                notEmpty: true              // Cannot be empty string
            },
            comment: 'The main content/text of the comment'
        },
        // DATABASE RESULT: content TEXT NOT NULL COMMENT 'The main content/text of the comment'

        /*
        COMMENT METADATA SECTION
        Information about the comment's state and properties
        */

        // WHETHER COMMENT HAS BEEN EDITED
        isEdited: {
            type: DataTypes.BOOLEAN,        // BOOLEAN - true or false
            defaultValue: false,            // Comments start as not edited
            comment: 'Whether the comment has been edited after creation'
        },
        // DATABASE RESULT: isEdited BOOLEAN DEFAULT FALSE

        // WHEN COMMENT WAS EDITED (if applicable)
        editedAt: {
            type: DataTypes.DATE,           // DATETIME type
            allowNull: true,                // Optional - only set when comment is edited
            comment: 'When the comment was last edited'
        },
        // DATABASE RESULT: editedAt DATETIME COMMENT 'When the comment was last edited'

        // COMMENT TYPE - Different kinds of comments
        commentType: {
            type: DataTypes.ENUM('comment', 'status_update', 'system', 'mention'),
            allowNull: false,
            defaultValue: 'comment',
            comment: 'Type of comment: regular comment, status update, system generated, or mention'
        },
        // COMMENT TYPES EXPLAINED:
        // - 'comment': Regular user comment
        // - 'status_update': Automatic comment when task status changes
        // - 'system': System-generated comment (like "User joined team")
        // - 'mention': Comment that mentions other users

        /*
        FOREIGN KEY SECTION
        References to other entities this comment is attached to
        */
        
        // COMMENT AUTHOR - Who wrote this comment
        userId: {
            type: DataTypes.INTEGER,        // INTEGER - matches User ID type
            allowNull: false,               // REQUIRED - every comment must have an author
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            },
            comment: 'Foreign key to users table - ID of user who wrote this comment'
        },
        // DATABASE RESULT: userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id)

        // TASK REFERENCE - Which task this comment is about (optional)
        taskId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Task ID type
            allowNull: true,                // OPTIONAL - not all comments are about tasks
            references: {                   // Foreign key constraint
                model: 'tasks',             // References the 'tasks' table
                key: 'id'                   // References the 'id' column in tasks table
            },
            comment: 'Foreign key to tasks table - ID of task this comment is about'
        },
        // DATABASE RESULT: taskId INT, FOREIGN KEY (taskId) REFERENCES tasks(id)

        // PROJECT REFERENCE - Which project this comment is about (optional)
        projectId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Project ID type
            allowNull: true,                // OPTIONAL - not all comments are about projects
            references: {                   // Foreign key constraint
                model: 'projects',          // References the 'projects' table
                key: 'id'                   // References the 'id' column in projects table
            },
            comment: 'Foreign key to projects table - ID of project this comment is about'
        },
        // DATABASE RESULT: projectId INT, FOREIGN KEY (projectId) REFERENCES projects(id)

        // TEAM REFERENCE - Which team this comment is about (optional)
        teamId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Team ID type
            allowNull: true,                // OPTIONAL - not all comments are about teams
            references: {                   // Foreign key constraint
                model: 'teams',             // References the 'teams' table
                key: 'id'                   // References the 'id' column in teams table
            },
            comment: 'Foreign key to teams table - ID of team this comment is about'
        },
        // DATABASE RESULT: teamId INT, FOREIGN KEY (teamId) REFERENCES teams(id)

        // PARENT COMMENT - For threaded/nested comments (optional)
        parentId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Comment ID type
            allowNull: true,                // OPTIONAL - not all comments are replies
            references: {                   // Foreign key constraint
                model: 'comments',          // References the 'comments' table (self-reference)
                key: 'id'                   // References the 'id' column in comments table
            },
            comment: 'Foreign key to comments table - ID of parent comment if this is a reply'
        },
        // DATABASE RESULT: parentId INT, FOREIGN KEY (parentId) REFERENCES comments(id)

        /*
        INTERACTION SECTION
        Fields for tracking engagement and mentions
        */

        // MENTIONED USERS - Array of user IDs mentioned in this comment
        mentions: {
            type: DataTypes.JSON,           // JSON type - stores array of user IDs
            allowNull: true,                // Optional field
            defaultValue: [],               // Empty array by default
            comment: 'Array of user IDs mentioned in this comment (@username)'
        },
        // DATABASE RESULT: mentions JSON COMMENT 'Array of user IDs mentioned in this comment (@username)'
        // EXAMPLE: [1, 5, 10] - user IDs that were @mentioned in the comment

        // REPLY COUNT - Cached count of replies to this comment
        replyCount: {
            type: DataTypes.INTEGER,        // INTEGER type
            defaultValue: 0,                // New comments have 0 replies
            comment: 'Cached count of replies to this comment'
        },
        // DATABASE RESULT: replyCount INT DEFAULT 0 COMMENT 'Cached count of replies to this comment'

        // PRIORITY LEVEL - For important comments or announcements
        priority: {
            type: DataTypes.ENUM('normal', 'important', 'urgent'),
            defaultValue: 'normal',         // Most comments are normal priority
            comment: 'Comment priority level for highlighting important discussions'
        }
        // DATABASE RESULT: priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal'

    }, {
        /*
        MODEL CONFIGURATION OPTIONS
        */
        
        sequelize,                          // Database connection instance
        modelName: 'Comment',               // Model name used internally by Sequelize
        tableName: 'comments',              // Actual table name in database
        timestamps: true,                   // Add createdAt and updatedAt columns
        paranoid: true,                     // Enable soft deletes (adds deletedAt column)
        
        /*
        DATABASE INDEXES for better query performance
        */
        indexes: [
            {
                fields: ['userId']          // Index on userId for faster lookup of comments by author
            },
            {
                fields: ['taskId']          // Index on taskId for faster lookup of task comments
            },
            {
                fields: ['projectId']       // Index on projectId for faster lookup of project comments
            },
            {
                fields: ['teamId']          // Index on teamId for faster lookup of team comments
            },
            {
                fields: ['parentId']        // Index on parentId for faster lookup of replies
            },
            {
                fields: ['createdAt']       // Index on createdAt for faster chronological sorting
            },
            {
                fields: ['taskId', 'createdAt'] // Compound index for task comments in chronological order
            },
            {
                fields: ['commentType']     // Index on commentType for filtering by comment type
            }
        ],

        /*
        DEFAULT SCOPE - what gets selected by default in queries
        */
        defaultScope: {
            where: { deletedAt: null }      // Only get non-deleted comments by default
        },
        
        /*
        NAMED SCOPES for common queries
        */
        scopes: {
            // Scope to get comments with author information
            withAuthor: {
                include: [{
                    model: sequelize.models.User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar', 'email']
                }]
            },
            
            // Scope to get only task comments
            taskComments: (taskId) => ({
                where: { taskId: taskId }
            }),
            
            // Scope to get only project comments
            projectComments: (projectId) => ({
                where: { projectId: projectId }
            }),
            
            // Scope to get only team comments
            teamComments: (teamId) => ({
                where: { teamId: teamId }
            }),
            
            // Scope to get top-level comments (not replies)
            topLevel: {
                where: { parentId: null }
            },
            
            // Scope to get only replies
            repliesOnly: {
                where: { parentId: { [Op.ne]: null } }
            },
            
            // Scope to get recent comments (last 7 days)
            recent: {
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            
            // Scope to get system comments
            systemComments: {
                where: {
                    commentType: 'system'
                }
            }
        },

        /*
        HOOKS - Automatically called during lifecycle events
        */
        hooks: {
            // Before creating a comment
            beforeCreate: async (comment, options) => {
                // Process mentions in the comment content
                const mentionRegex = /@(\w+)/g;
                const mentions = [];
                let match;
                
                while ((match = mentionRegex.exec(comment.content)) !== null) {
                    // Here you could look up users by username and get their IDs
                    mentions.push(match[1]);
                }
                
                if (mentions.length > 0 && !comment.mentions) {
                    comment.mentions = mentions;
                }
            },

            // After creating a comment
            afterCreate: async (comment, options) => {
                // Update parent comment reply count if this is a reply
                if (comment.parentId) {
                    await sequelize.models.Comment.increment('replyCount', {
                        where: { id: comment.parentId }
                    });
                }
                
                console.log(`Comment created by user ${comment.userId}`);
            },

            // Before updating a comment
            beforeUpdate: async (comment, options) => {
                // If content is being changed, mark as edited
                if (comment.changed('content')) {
                    comment.isEdited = true;
                    comment.editedAt = new Date();
                }
            },

            // Before destroying (soft delete)
            beforeDestroy: async (comment, options) => {
                // Update parent comment reply count if this is a reply being deleted
                if (comment.parentId) {
                    await sequelize.models.Comment.decrement('replyCount', {
                        where: { id: comment.parentId }
                    });
                }
            }
        }
    });

    return Comment;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL COMMENT 'The main content/text of the comment',
    isEdited BOOLEAN DEFAULT FALSE COMMENT 'Whether the comment has been edited after creation',
    editedAt DATETIME COMMENT 'When the comment was last edited',
    commentType ENUM('comment', 'status_update', 'system', 'mention') DEFAULT 'comment' COMMENT 'Type of comment: regular comment, status update, system generated, or mention',
    userId INT NOT NULL COMMENT 'Foreign key to users table - ID of user who wrote this comment',
    taskId INT COMMENT 'Foreign key to tasks table - ID of task this comment is about',
    projectId INT COMMENT 'Foreign key to projects table - ID of project this comment is about',
    teamId INT COMMENT 'Foreign key to teams table - ID of team this comment is about',
    parentId INT COMMENT 'Foreign key to comments table - ID of parent comment if this is a reply',
    mentions JSON COMMENT 'Array of user IDs mentioned in this comment (@username)',
    replyCount INT DEFAULT 0 COMMENT 'Cached count of replies to this comment',
    priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal' COMMENT 'Comment priority level for highlighting important discussions',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME,
    
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_comments_userId (userId),
    INDEX idx_comments_taskId (taskId),
    INDEX idx_comments_projectId (projectId),
    INDEX idx_comments_teamId (teamId),
    INDEX idx_comments_parentId (parentId),
    INDEX idx_comments_createdAt (createdAt),
    INDEX idx_comments_taskId_createdAt (taskId, createdAt),
    INDEX idx_comments_commentType (commentType)
);

HOW TO USE THIS MODEL:

// Create a task comment
const comment = await Comment.create({
    content: 'This task is ready for testing!',
    userId: 1,
    taskId: 5,
    commentType: 'comment'
});

// Create a reply to a comment
const reply = await Comment.create({
    content: 'Great! I will test it now.',
    userId: 2,
    taskId: 5,
    parentId: comment.id
});

// Get all comments for a task with author info and replies
const taskComments = await Comment.getTaskComments(taskId, 0, 20);

// Search comments
const searchResults = await Comment.searchComments('ready', 'task', 5);

// Get comment thread with all replies
const thread = await Comment.getThread(commentId);

// Use scopes
const recentComments = await Comment.scope('recent').findAll();
const taskComments = await Comment.scope('taskComments').call(Comment, taskId);

// Use instance methods
const canEdit = comment.canEdit(userId, 30); // 30 minute edit window
const formattedTime = comment.getFormattedTime();
const replyCount = await comment.getReplyCount();

// Update comment
await comment.update({ content: 'Updated comment content' });

// Soft delete comment (preserves for history)
await comment.destroy();
*/