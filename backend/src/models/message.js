// Import the Model class from Sequelize
// Model is the base class that all our database models will extend from
// It provides methods like findAll(), create(), update(), destroy() etc.
const { Model, Op } = require('sequelize');

// Export a function that takes sequelize connection and DataTypes
// This pattern allows the index.js file to pass these parameters when loading models
// sequelize = database connection instance
// DataTypes = object containing all Sequelize data types (STRING, INTEGER, BOOLEAN, etc.)
module.exports = (sequelize, DataTypes) => {
    
    // Define Message class that extends Sequelize's Model class
    // This gives us access to all database methods like findAll(), create(), etc.
    // Think of this as creating a blueprint for the 'messages' table
    class Message extends Model {
        
        // Static method to define relationships between this model and other models
        // 'static' means this method belongs to the class itself, not individual instances
        // This is called automatically by index.js after all models are loaded
        static associate(models) {
            
            // RELATIONSHIP 1: Message belongs to one User (sender)
            // Each message is sent by exactly one user
            // This creates a foreign key 'senderId' in the messages table
            Message.belongsTo(models.User, {
                foreignKey: 'senderId',     // Column name in messages table that references users.id
                as: 'sender'                // Alias to use in queries: message.getSender()
            });
            // Usage: const message = await Message.findByPk(1, { include: { model: User, as: 'sender' } });

            // RELATIONSHIP 2: Message belongs to one Team
            // Each message belongs to exactly one team's chat
            // This creates a foreign key 'teamId' in the messages table
            Message.belongsTo(models.Team, {
                foreignKey: 'teamId',       // Column name in messages table that references teams.id
                as: 'team'                  // Alias to use in queries: message.getTeam()
            });
            // Usage: const message = await Message.findByPk(1, { include: { model: Team, as: 'team' } });

            // RELATIONSHIP 3: Message belongs to one Message (parent - for replies)
            // Messages can be replies to other messages (thread system)
            // This creates a foreign key 'parentId' in the messages table
            Message.belongsTo(models.Message, {
                foreignKey: 'parentId',     // Column name in messages table that references messages.id
                as: 'parentMessage'         // Alias to use in queries: message.getParentMessage()
            });
            // Usage: const message = await Message.findByPk(1, { include: { model: Message, as: 'parentMessage' } });

            // RELATIONSHIP 4: Message has many Messages (replies)
            // One message can have multiple replies
            // This is the reverse of the parentMessage relationship
            Message.hasMany(models.Message, {
                foreignKey: 'parentId',     // Column in messages table that references this message's id
                as: 'replies'               // Alias: message.getReplies(), message.createReply()
            });
            // Usage: const replies = await message.getReplies();

            // RELATIONSHIP 5: Message has many Reactions
            // One message can have multiple emoji reactions from different users
            // This creates a foreign key 'messageId' in the reactions table
            Message.hasMany(models.Reaction, {
                foreignKey: 'messageId',    // Column in reactions table that references messages.id
                as: 'reactions'             // Alias: message.getReactions(), message.createReaction()
            });
            // Usage: const reactions = await message.getReactions();

            // RELATIONSHIP 6: Message has many Attachments
            // One message can have multiple file attachments
            // This creates a foreign key 'messageId' in the attachments table
            Message.hasMany(models.Attachment, {
                foreignKey: 'messageId',    // Column in attachments table that references messages.id
                as: 'messageAttachments'    // Alias: message.getMessageAttachments(), message.createMessageAttachment()
            });
            // Usage: const attachments = await message.getMessageAttachments();
        }

        // INSTANCE METHODS - Called on individual message records
        
        // Check if message can be edited (within edit time limit)
        canEdit(userId, timeLimit = 15) { // 15 minutes default
            if (this.senderId !== userId) return false;
            if (this.isEdited) return false; // Already edited once
            
            const now = new Date();
            const created = new Date(this.createdAt);
            const diffMinutes = (now - created) / (1000 * 60);
            
            return diffMinutes <= timeLimit;
        }

        // Check if message can be deleted
        canDelete(userId) {
            return this.senderId === userId || this.isSystemMessage;
        }

        // Get formatted timestamp for display
        getFormattedTime() {
            const now = new Date();
            const messageTime = new Date(this.createdAt);
            const diffSeconds = (now - messageTime) / 1000;
            
            if (diffSeconds < 60) return 'Just now';
            if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
            if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
            
            return messageTime.toLocaleDateString();
        }

        // Check if message is a reply
        isReply() {
            return this.parentId !== null;
        }

        // Get reply count
        async getReplyCount() {
            return await this.countReplies();
        }

        // Get reaction summary
        async getReactionSummary() {
            const reactions = await this.getReactions();
            const summary = {};
            
            reactions.forEach(reaction => {
                if (!summary[reaction.emoji]) {
                    summary[reaction.emoji] = { count: 0, users: [] };
                }
                summary[reaction.emoji].count++;
                summary[reaction.emoji].users.push(reaction.userId);
            });
            
            return summary;
        }

        // Mark message as edited
        async markAsEdited() {
            return await this.update({
                isEdited: true,
                editedAt: new Date()
            });
        }

        // STATIC METHODS - Called on the Message model itself
        
        // Get messages for a team with pagination
        static async getTeamMessages(teamId, offset = 0, limit = 50) {
            return await this.findAndCountAll({
                where: { teamId: teamId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'sender',
                        attributes: ['id', 'name', 'avatar']
                    },
                    { 
                        model: sequelize.models.Message, 
                        as: 'parentMessage',
                        include: [{ 
                            model: sequelize.models.User, 
                            as: 'sender',
                            attributes: ['id', 'name'] 
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']],
                offset: offset,
                limit: limit
            });
        }

        // Search messages in a team
        static async searchTeamMessages(teamId, searchTerm) {
            return await this.findAll({
                where: {
                    teamId: teamId,
                    content: { [Op.like]: `%${searchTerm}%` }
                },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'sender',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get messages by type
        static async getMessagesByType(teamId, messageType) {
            return await this.findAll({
                where: { 
                    teamId: teamId,
                    messageType: messageType 
                },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'sender',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get thread messages (message and all its replies)
        static async getThread(messageId) {
            const parentMessage = await this.findByPk(messageId, {
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'sender',
                        attributes: ['id', 'name', 'avatar']
                    },
                    {
                        model: sequelize.models.Message,
                        as: 'replies',
                        include: [{ 
                            model: sequelize.models.User, 
                            as: 'sender',
                            attributes: ['id', 'name', 'avatar']
                        }],
                        order: [['createdAt', 'ASC']]
                    }
                ]
            });
            
            return parentMessage;
        }
    }

    // Initialize the Message model with its attributes (columns) and options
    // This defines what the 'messages' table will look like in the database
    Message.init({
        
        // MESSAGE CONTENT SECTION
        
        // Message content/text - required field
        content: {
            type: DataTypes.TEXT,           // TEXT type in SQL (can store long messages)
            allowNull: false,               // NOT NULL constraint - every message must have content
            validate: {                     // Custom validation rules
                len: [1, 5000],             // Message must be between 1 and 5000 characters
                notEmpty: true              // Cannot be empty string
            }
            // Database: content TEXT NOT NULL
        },

        // MESSAGE TYPE SECTION
        
        // Type of message (text, file, image, system notification, etc.)
        messageType: {
            type: DataTypes.ENUM('text', 'file', 'image', 'video', 'audio', 'system', 'announcement'),
            allowNull: false,               // Required field
            defaultValue: 'text',           // Most messages are text
            comment: 'Type of message content'
            // Database: messageType ENUM('text', 'file', 'image', 'video', 'audio', 'system', 'announcement') DEFAULT 'text'
        },

        // MESSAGE METADATA SECTION
        
        // Whether this is a system-generated message
        isSystemMessage: {
            type: DataTypes.BOOLEAN,        // BOOLEAN type in SQL (true/false)
            defaultValue: false,            // Most messages are from users, not system
            comment: 'Whether this message was generated by the system'
            // Database: isSystemMessage BOOLEAN DEFAULT FALSE COMMENT 'Whether this message was generated by the system'
        },

        // Whether the message has been edited
        isEdited: {
            type: DataTypes.BOOLEAN,        // BOOLEAN type in SQL (true/false)
            defaultValue: false,            // Messages start as not edited
            comment: 'Whether the message has been edited after creation'
            // Database: isEdited BOOLEAN DEFAULT FALSE COMMENT 'Whether the message has been edited after creation'
        },

        // When the message was edited (if applicable)
        editedAt: {
            type: DataTypes.DATE,           // DATETIME type in SQL
            allowNull: true,                // Optional - only set when message is edited
            comment: 'When the message was last edited'
            // Database: editedAt DATETIME COMMENT 'When the message was last edited'
        },

        // Whether the message is pinned in the channel
        isPinned: {
            type: DataTypes.BOOLEAN,        // BOOLEAN type in SQL (true/false)
            defaultValue: false,            // Messages are not pinned by default
            comment: 'Whether the message is pinned in the team chat'
            // Database: isPinned BOOLEAN DEFAULT FALSE COMMENT 'Whether the message is pinned in the team chat'
        },

        // FOREIGN KEY SECTION
        
        // Reference to the user who sent this message
        senderId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required - every message must have a sender
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            }
            // Database: senderId INT NOT NULL, FOREIGN KEY (senderId) REFERENCES users(id)
        },
        
        // Reference to the team this message belongs to
        teamId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: false,               // Required - every message must belong to a team
            references: {                   // Foreign key constraint
                model: 'teams',             // References the 'teams' table
                key: 'id'                   // References the 'id' column in teams table
            }
            // Database: teamId INT NOT NULL, FOREIGN KEY (teamId) REFERENCES teams(id)
        },

        // Reference to parent message (for replies/threads)
        parentId: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            allowNull: true,                // Optional - not all messages are replies
            references: {                   // Foreign key constraint
                model: 'messages',          // References the 'messages' table (self-reference)
                key: 'id'                   // References the 'id' column in messages table
            },
            comment: 'ID of the parent message if this is a reply'
            // Database: parentId INT, FOREIGN KEY (parentId) REFERENCES messages(id)
        },

        // ATTACHMENT AND MEDIA SECTION
        
        // File attachments (stored as JSON array of file objects)
        attachments: {
            type: DataTypes.JSON,           // JSON type - stores array of attachment objects
            allowNull: true,                // Optional field
            defaultValue: [],               // Empty array by default
            comment: 'Array of file attachments'
            // Database: attachments JSON COMMENT 'Array of file attachments'
            // Example: [{ name: 'document.pdf', url: 'https://...', size: 1024, type: 'application/pdf' }]
        },

        // Mentions in the message (stored as JSON array of user IDs)
        mentions: {
            type: DataTypes.JSON,           // JSON type - stores array of user IDs
            allowNull: true,                // Optional field
            defaultValue: [],               // Empty array by default
            comment: 'Array of mentioned user IDs'
            // Database: mentions JSON COMMENT 'Array of mentioned user IDs'
            // Example: [1, 5, 10] - user IDs that were @mentioned in the message
        },

        // THREAD AND INTERACTION SECTION
        
        // Number of replies to this message (cached for performance)
        replyCount: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            defaultValue: 0,                // New messages have 0 replies
            comment: 'Cached count of replies to this message'
            // Database: replyCount INT DEFAULT 0 COMMENT 'Cached count of replies to this message'
        },

        // Number of reactions to this message (cached for performance)
        reactionCount: {
            type: DataTypes.INTEGER,        // INTEGER type in SQL
            defaultValue: 0,                // New messages have 0 reactions
            comment: 'Cached count of reactions to this message'
            // Database: reactionCount INT DEFAULT 0 COMMENT 'Cached count of reactions to this message'
        },

        // MESSAGE PRIORITY (for announcements or important messages)
        priority: {
            type: DataTypes.ENUM('normal', 'important', 'urgent'),
            defaultValue: 'normal',         // Most messages are normal priority
            comment: 'Message priority level'
            // Database: priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal'
        }

        // NOTE: Sequelize automatically adds these columns unless disabled:
        // - id: Primary key (auto-increment integer)
        // - createdAt: When message was sent
        // - updatedAt: When message was last modified

    }, {
        // MODEL CONFIGURATION OPTIONS
        
        sequelize,                          // Pass the database connection instance
        modelName: 'Message',               // Model name (used internally by Sequelize)
        tableName: 'messages',              // Actual table name in database (lowercase plural)
        timestamps: true,                   // Automatically add createdAt and updatedAt columns
        paranoid: true,                     // Enable soft deletes (adds deletedAt column for message history)
        
        // DATABASE INDEXES for better query performance
        // Indexes make database queries faster by creating shortcuts to find data
        indexes: [
            {
                fields: ['teamId']          // Index on teamId for faster lookup of messages by team
            },
            {
                fields: ['senderId']        // Index on senderId for faster lookup of messages by sender
            },
            {
                fields: ['parentId']        // Index on parentId for faster lookup of replies
            },
            {
                fields: ['messageType']     // Index on messageType for faster filtering by type
            },
            {
                fields: ['createdAt']       // Index on createdAt for faster chronological queries
            },
            {
                fields: ['teamId', 'createdAt'] // Compound index for team messages in chronological order
            },
            {
                fields: ['isPinned']        // Index on isPinned for faster lookup of pinned messages
            },
            {
                fields: ['priority']        // Index on priority for faster filtering by priority
            }
        ],
        // SQL equivalent: 
        // CREATE INDEX idx_messages_teamId ON messages(teamId);
        // CREATE INDEX idx_messages_senderId ON messages(senderId);
        // etc.

        // DEFAULT SCOPE - what gets selected by default in queries
        defaultScope: {
            where: { deletedAt: null }      // Only get non-deleted messages by default
        },
        
        // NAMED SCOPES for common queries
        // Scopes are predefined query conditions that can be reused
        scopes: {
            // Scope to get messages with sender information
            withSender: {
                include: [{
                    model: sequelize.models.User,
                    as: 'sender',
                    attributes: ['id', 'name', 'avatar', 'email']
                }]
            },
            // Scope to get only text messages
            textOnly: {
                where: {
                    messageType: 'text'
                }
            },
            // Scope to get only file messages
            filesOnly: {
                where: {
                    messageType: ['file', 'image', 'video', 'audio']
                }
            },
            // Scope to get pinned messages
            pinned: {
                where: {
                    isPinned: true
                }
            },
            // Scope to get system messages
            systemMessages: {
                where: {
                    isSystemMessage: true
                }
            },
            // Scope to get messages from last 24 hours
            recent: {
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            },
            // Scope to get thread messages (non-replies)
            threadsOnly: {
                where: {
                    parentId: null
                }
            }
        },

        // HOOKS - Automatically called during lifecycle events
        hooks: {
            // Before creating a message
            beforeCreate: async (message, options) => {
                // Process mentions in the message content
                const mentionRegex = /@(\w+)/g;
                const mentions = [];
                let match;
                
                while ((match = mentionRegex.exec(message.content)) !== null) {
                    // Here you could look up users by username and get their IDs
                    // For now, we'll just store the usernames
                    mentions.push(match[1]);
                }
                
                if (mentions.length > 0 && !message.mentions) {
                    message.mentions = mentions;
                }
            },

            // After creating a message
            afterCreate: async (message, options) => {
                // Update parent message reply count if this is a reply
                if (message.parentId) {
                    await sequelize.models.Message.increment('replyCount', {
                        where: { id: message.parentId }
                    });
                }
                
                // Log message creation
                console.log(`Message sent in team ${message.teamId} by user ${message.senderId}`);
                
                // Send notifications to mentioned users
                if (message.mentions && message.mentions.length > 0) {
                    // Create notifications for mentioned users
                    // for (const mentionedUserId of message.mentions) {
                    //     await Notification.create({
                    //         userId: mentionedUserId,
                    //         type: 'mention',
                    //         message: `You were mentioned in a message`,
                    //         relatedId: message.id,
                    //         relatedType: 'message'
                    //     });
                    // }
                }
            },

            // Before updating a message
            beforeUpdate: async (message, options) => {
                // If content is being changed, mark as edited
                if (message.changed('content')) {
                    message.isEdited = true;
                    message.editedAt = new Date();
                }
            },

            // Before destroying (soft delete)
            beforeDestroy: async (message, options) => {
                // Update parent message reply count if this is a reply being deleted
                if (message.parentId) {
                    await sequelize.models.Message.decrement('replyCount', {
                        where: { id: message.parentId }
                    });
                }
            }
        }
    });

    // Return the Message model so it can be used by index.js and throughout the application
    // This makes the model available as: const { Message } = require('../models');
    return Message;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    messageType ENUM('text', 'file', 'image', 'video', 'audio', 'system', 'announcement') DEFAULT 'text',
    isSystemMessage BOOLEAN DEFAULT FALSE COMMENT 'Whether this message was generated by the system',
    isEdited BOOLEAN DEFAULT FALSE COMMENT 'Whether the message has been edited after creation',
    editedAt DATETIME COMMENT 'When the message was last edited',
    isPinned BOOLEAN DEFAULT FALSE COMMENT 'Whether the message is pinned in the team chat',
    senderId INT NOT NULL,
    teamId INT NOT NULL,
    parentId INT COMMENT 'ID of the parent message if this is a reply',
    attachments JSON COMMENT 'Array of file attachments',
    mentions JSON COMMENT 'Array of mentioned user IDs',
    replyCount INT DEFAULT 0 COMMENT 'Cached count of replies to this message',
    reactionCount INT DEFAULT 0 COMMENT 'Cached count of reactions to this message',
    priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME,
    
    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (teamId) REFERENCES teams(id),
    FOREIGN KEY (parentId) REFERENCES messages(id),
    INDEX idx_messages_teamId (teamId),
    INDEX idx_messages_senderId (senderId),
    INDEX idx_messages_parentId (parentId),
    INDEX idx_messages_messageType (messageType),
    INDEX idx_messages_createdAt (createdAt),
    INDEX idx_messages_teamId_createdAt (teamId, createdAt),
    INDEX idx_messages_isPinned (isPinned),
    INDEX idx_messages_priority (priority)
);

HOW TO USE THIS MODEL:

// Send a message
const message = await Message.create({
    content: 'Hello everyone! 👋 @john @jane',
    senderId: 1,
    teamId: 1,
    messageType: 'text',
    mentions: [2, 3] // IDs of john and jane
});

// Get team messages with pagination
const { rows: messages, count } = await Message.getTeamMessages(teamId, 0, 50);

// Search messages
const searchResults = await Message.searchTeamMessages(teamId, 'hello');

// Reply to a message
const reply = await Message.create({
    content: 'Great point!',
    senderId: 2,
    teamId: 1,
    parentId: message.id
});

// Get thread with all replies
const thread = await Message.getThread(messageId);

// Use scopes
const textMessages = await Message.scope('textOnly').findAll();
const pinnedMessages = await Message.scope('pinned').findAll();
const recentMessages = await Message.scope('recent').findAll();

// Use instance methods
const canEdit = message.canEdit(userId);
const formattedTime = message.getFormattedTime();
const reactionSummary = await message.getReactionSummary();

// Edit message
await message.update({ content: 'Updated message content' });

// Pin/unpin message
await message.update({ isPinned: true });

// Soft delete message (preserves for history)
await message.destroy();
*/