/*
WHAT IS THE REACTION MODEL?
The Reaction model represents emoji reactions that users can add to messages and comments.
Think of it like Facebook "likes", Slack emoji reactions, or Discord reactions.

REAL WORLD EXAMPLES:
- 👍 (thumbs up) on a helpful message
- ❤️ (heart) on a supportive comment
- 😂 (laugh) on a funny message
- 🔥 (fire) on an exciting announcement
- ✅ (checkmark) on a completed task update
- 🎉 (party) on a project milestone

KEY FEATURES OF REACTIONS:
- Belongs to a message or comment
- Has a reactor (the user who added the reaction)
- Stores the emoji/reaction type
- Prevents duplicate reactions (one user, one emoji per message/comment)
- Tracks when the reaction was added
- Can be easily added, removed, and counted

WHAT DOES THIS FILE DO?
- Defines the structure of the reactions table in the database
- Sets up relationships with Message, Comment, and User models
- Provides methods to work with reaction data
- Handles reaction validation and duplicate prevention
- Manages reaction counting and statistics
*/

// Import the Model class and Op (Operators) from Sequelize
// Model gives us all the database superpowers (create, find, update, delete)
// Op provides query operators like Op.like, Op.gte, etc.
const { Model, Op } = require('sequelize');

// Export a function that receives database connection and data types
// This pattern allows index.js to pass the connection when loading models
module.exports = (sequelize, DataTypes) => {
    
    // Define Reaction class that extends Sequelize's Model class
    // This gives us access to methods like Reaction.create(), Reaction.findAll(), etc.
    class Reaction extends Model {
        
        // Static method to define relationships with other models
        // Called automatically after all models are loaded
        static associate(models) {
            
            /*
            REACTION RELATIONSHIPS EXPLAINED:
            
            Think of reactions like stickers on a bulletin board:
            - "Reaction belongs to User" = Every reaction has someone who added it
            - "Reaction belongs to Message" = Reactions can be on chat messages
            - "Reaction belongs to Comment" = Reactions can be on discussion comments
            - "Message/Comment has many Reactions" = Each message/comment can have multiple reactions
            */
            
            // RELATIONSHIP 1: Reaction belongs to one User (reactor)
            // REAL WORLD: Every reaction needs someone who added it
            // DATABASE: Adds 'userId' column in reactions table that references users.id
            Reaction.belongsTo(models.User, {
                foreignKey: 'userId',           // Column in reactions table storing reactor's user ID
                as: 'reactor'                   // Alias for queries: reaction.getReactor()
            });
            // USAGE: const reactor = await reaction.getReactor();
            // SQL EQUIVALENT: SELECT * FROM users WHERE id = reaction.userId;

            // RELATIONSHIP 2: Reaction belongs to one Message (optional)
            // REAL WORLD: Reactions can be on chat messages
            // EXAMPLE: 👍 on "Great job everyone!", 😂 on a funny message
            // DATABASE: Adds 'messageId' column in reactions table
            Reaction.belongsTo(models.Message, {
                foreignKey: 'messageId',        // Column in reactions table storing message's ID
                as: 'message'                   // Alias for queries: reaction.getMessage()
            });
            // USAGE: const message = await reaction.getMessage();

            // RELATIONSHIP 3: Reaction belongs to one Comment (optional)
            // REAL WORLD: Reactions can be on discussion comments
            // EXAMPLE: ✅ on a helpful explanation, ❤️ on supportive feedback
            // DATABASE: Adds 'commentId' column in reactions table
            Reaction.belongsTo(models.Comment, {
                foreignKey: 'commentId',        // Column in reactions table storing comment's ID
                as: 'comment'                   // Alias for queries: reaction.getComment()
            });
            // USAGE: const comment = await reaction.getComment();

            // RELATIONSHIP 4: Reaction belongs to one Task (optional)
            // REAL WORLD: Reactions can be directly on tasks
            // EXAMPLE: 🎉 on a completed task, 🔥 on an urgent task
            // DATABASE: Adds 'taskId' column in reactions table
            Reaction.belongsTo(models.Task, {
                foreignKey: 'taskId',           // Column in reactions table storing task's ID
                as: 'task'                      // Alias for queries: reaction.getTask()
            });
            // USAGE: const task = await reaction.getTask();
        }

        /*
        INSTANCE METHODS SECTION
        These are functions you can call on individual reaction records
        */

        // Get the target of this reaction (what it's reacting to)
        getReactionTarget() {
            if (this.messageId) return { type: 'message', id: this.messageId };
            if (this.commentId) return { type: 'comment', id: this.commentId };
            if (this.taskId) return { type: 'task', id: this.taskId };
            return { type: 'unknown', id: null };
        }

        // Check if this is a positive reaction
        isPositive() {
            const positiveEmojis = ['👍', '❤️', '😍', '🔥', '✅', '🎉', '👏', '💪', '🌟', '💯'];
            return positiveEmojis.includes(this.emoji);
        }

        // Check if this is a negative reaction
        isNegative() {
            const negativeEmojis = ['👎', '😞', '😢', '😡', '❌', '⚠️', '💔'];
            return negativeEmojis.includes(this.emoji);
        }

        // Get emoji category
        getEmojiCategory() {
            const categories = {
                approval: ['👍', '✅', '💯', '👏'],
                love: ['❤️', '😍', '💖', '🥰'],
                excitement: ['🔥', '🎉', '🌟', '⚡'],
                humor: ['😂', '😄', '🤣', '😆'],
                support: ['💪', '🤝', '👊', '🙌'],
                concern: ['😟', '😕', '🤔', '⚠️'],
                disapproval: ['👎', '❌', '😞', '😡']
            };

            for (const [category, emojis] of Object.entries(categories)) {
                if (emojis.includes(this.emoji)) return category;
            }
            return 'other';
        }

        /*
        STATIC METHODS SECTION
        These are functions you call on the Reaction model itself
        */

        // Add a reaction (prevents duplicates)
        static async addReaction(userId, emoji, targetType, targetId) {
            const targetColumn = `${targetType}Id`;
            
            // Check if user already reacted with this emoji
            const existing = await this.findOne({
                where: {
                    userId: userId,
                    emoji: emoji,
                    [targetColumn]: targetId
                }
            });

            if (existing) {
                // User already reacted with this emoji, remove it (toggle behavior)
                await existing.destroy();
                return { action: 'removed', reaction: null };
            } else {
                // Create new reaction
                const reactionData = {
                    userId: userId,
                    emoji: emoji,
                    [targetColumn]: targetId
                };

                const reaction = await this.create(reactionData);
                return { action: 'added', reaction: reaction };
            }
        }

        // Get all reactions for a specific target
        static async getReactionsFor(targetType, targetId) {
            const targetColumn = `${targetType}Id`;
            
            return await this.findAll({
                where: { [targetColumn]: targetId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'reactor',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get reaction summary with counts
        static async getReactionSummary(targetType, targetId) {
            const targetColumn = `${targetType}Id`;
            
            const reactions = await this.findAll({
                where: { [targetColumn]: targetId },
                attributes: [
                    'emoji',
                    [sequelize.fn('COUNT', sequelize.col('emoji')), 'count']
                ],
                group: ['emoji'],
                order: [[sequelize.literal('count'), 'DESC']]
            });

            return reactions.map(r => ({
                emoji: r.emoji,
                count: parseInt(r.dataValues.count)
            }));
        }

        // Get user's reactions for a target
        static async getUserReactions(userId, targetType, targetId) {
            const targetColumn = `${targetType}Id`;
            
            return await this.findAll({
                where: {
                    userId: userId,
                    [targetColumn]: targetId
                },
                attributes: ['emoji', 'createdAt']
            });
        }

        // Remove a specific reaction
        static async removeReaction(userId, emoji, targetType, targetId) {
            const targetColumn = `${targetType}Id`;
            
            const reaction = await this.findOne({
                where: {
                    userId: userId,
                    emoji: emoji,
                    [targetColumn]: targetId
                }
            });

            if (reaction) {
                await reaction.destroy();
                return true;
            }
            return false;
        }

        // Get most popular reactions
        static async getPopularReactions(limit = 10) {
            return await this.findAll({
                attributes: [
                    'emoji',
                    [sequelize.fn('COUNT', sequelize.col('emoji')), 'totalCount']
                ],
                group: ['emoji'],
                order: [[sequelize.literal('totalCount'), 'DESC']],
                limit: limit
            });
        }

        // Get reaction statistics for a user
        static async getUserReactionStats(userId) {
            const stats = await this.findAll({
                where: { userId: userId },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalReactions'],
                    'emoji',
                    [sequelize.fn('COUNT', sequelize.col('emoji')), 'emojiCount']
                ],
                group: ['emoji'],
                order: [[sequelize.literal('emojiCount'), 'DESC']]
            });

            const totalReactions = await this.count({
                where: { userId: userId }
            });

            return {
                totalReactions: totalReactions,
                favoriteEmojis: stats.slice(0, 5),
                reactionBreakdown: stats
            };
        }

        // Get reactions by time period
        static async getReactionsByPeriod(targetType, targetId, period = '24h') {
            const targetColumn = `${targetType}Id`;
            let timeRange;

            switch (period) {
                case '1h':
                    timeRange = new Date(Date.now() - 60 * 60 * 1000);
                    break;
                case '24h':
                    timeRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    timeRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
            }

            return await this.findAll({
                where: {
                    [targetColumn]: targetId,
                    createdAt: {
                        [Op.gte]: timeRange
                    }
                },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'reactor',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Bulk add reactions for testing/seeding
        static async bulkAddReactions(reactionData) {
            const reactions = [];
            
            for (const data of reactionData) {
                try {
                    const result = await this.addReaction(
                        data.userId,
                        data.emoji,
                        data.targetType,
                        data.targetId
                    );
                    if (result.action === 'added') {
                        reactions.push(result.reaction);
                    }
                } catch (error) {
                    console.error('Error adding reaction:', error);
                }
            }
            
            return reactions;
        }

        // Get reaction leaderboard (most active reactors)
        static async getReactionLeaderboard(limit = 10) {
            return await this.findAll({
                attributes: [
                    'userId',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'reactionCount']
                ],
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'reactor',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                group: ['userId'],
                order: [[sequelize.literal('reactionCount'), 'DESC']],
                limit: limit
            });
        }
    }

    // Initialize the Reaction model with its attributes (columns) and options
    Reaction.init({
        
        /*
        CORE REACTION ATTRIBUTES SECTION
        */
        
        // EMOJI - The actual emoji/reaction character
        // EXAMPLES: "👍", "❤️", "😂", "🔥", "✅", "🎉"
        emoji: {
            type: DataTypes.STRING(10),         // VARCHAR(10) - enough for complex emojis
            allowNull: false,                   // REQUIRED - every reaction needs an emoji
            validate: {
                notEmpty: true,                 // Cannot be empty string
                len: [1, 10]                    // Between 1 and 10 characters
            },
            comment: 'The emoji character representing the reaction'
        },
        // DATABASE RESULT: emoji VARCHAR(10) NOT NULL COMMENT 'The emoji character representing the reaction'

        // REACTION TYPE - Category or type of reaction (optional classification)
        reactionType: {
            type: DataTypes.ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow', 'care', 'custom'),
            allowNull: true,                    // OPTIONAL - can be auto-detected from emoji
            comment: 'Optional classification of reaction type for filtering and analytics'
        },
        // REACTION TYPES EXPLAINED:
        // - 'like': General approval (👍, ✅, 💯)
        // - 'love': Affection and appreciation (❤️, 😍, 🥰)
        // - 'laugh': Humor and fun (😂, 🤣, 😄)
        // - 'angry': Disagreement or frustration (😡, 😤, 👎)
        // - 'sad': Sympathy or disappointment (😢, 😞, 💔)
        // - 'wow': Surprise or amazement (😮, 🤯, 🔥)
        // - 'care': Support and encouragement (🤗, 💪, 🙌)
        // - 'custom': Any other emoji not fitting above categories

        /*
        FOREIGN KEY SECTION
        References to other entities this reaction is related to
        */
        
        // REACTOR - Who added this reaction
        userId: {
            type: DataTypes.INTEGER,            // INTEGER - matches User ID type
            allowNull: false,                   // REQUIRED - every reaction must have a user
            references: {                       // Foreign key constraint
                model: 'users',                 // References the 'users' table
                key: 'id'                       // References the 'id' column in users table
            },
            comment: 'Foreign key to users table - ID of user who added this reaction'
        },
        // DATABASE RESULT: userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id)

        // MESSAGE REFERENCE - Which message this reaction is on (optional)
        messageId: {
            type: DataTypes.INTEGER,            // INTEGER - matches Message ID type
            allowNull: true,                    // OPTIONAL - not all reactions are on messages
            references: {                       // Foreign key constraint
                model: 'messages',              // References the 'messages' table
                key: 'id'                       // References the 'id' column in messages table
            },
            comment: 'Foreign key to messages table - ID of message this reaction is on'
        },
        // DATABASE RESULT: messageId INT, FOREIGN KEY (messageId) REFERENCES messages(id)

        // COMMENT REFERENCE - Which comment this reaction is on (optional)
        commentId: {
            type: DataTypes.INTEGER,            // INTEGER - matches Comment ID type
            allowNull: true,                    // OPTIONAL - not all reactions are on comments
            references: {                       // Foreign key constraint
                model: 'comments',              // References the 'comments' table
                key: 'id'                       // References the 'id' column in comments table
            },
            comment: 'Foreign key to comments table - ID of comment this reaction is on'
        },
        // DATABASE RESULT: commentId INT, FOREIGN KEY (commentId) REFERENCES comments(id)

        // TASK REFERENCE - Which task this reaction is on (optional)
        taskId: {
            type: DataTypes.INTEGER,            // INTEGER - matches Task ID type
            allowNull: true,                    // OPTIONAL - not all reactions are on tasks
            references: {                       // Foreign key constraint
                model: 'tasks',                 // References the 'tasks' table
                key: 'id'                       // References the 'id' column in tasks table
            },
            comment: 'Foreign key to tasks table - ID of task this reaction is on'
        }
        // DATABASE RESULT: taskId INT, FOREIGN KEY (taskId) REFERENCES tasks(id)

    }, {
        /*
        MODEL CONFIGURATION OPTIONS
        */
        
        sequelize,                              // Database connection instance
        modelName: 'Reaction',                  // Model name used internally by Sequelize
        tableName: 'reactions',                 // Actual table name in database
        timestamps: true,                       // Add createdAt and updatedAt columns
        paranoid: false,                        // No soft deletes for reactions (permanent delete)
        
        /*
        DATABASE INDEXES for better query performance
        */
        indexes: [
            {
                fields: ['userId']              // Index on userId for faster lookup of user's reactions
            },
            {
                fields: ['messageId']           // Index on messageId for faster lookup of message reactions
            },
            {
                fields: ['commentId']           // Index on commentId for faster lookup of comment reactions
            },
            {
                fields: ['taskId']              // Index on taskId for faster lookup of task reactions
            },
            {
                fields: ['emoji']               // Index on emoji for analytics and filtering
            },
            {
                fields: ['reactionType']        // Index on reactionType for category filtering
            },
            {
                fields: ['createdAt']           // Index on createdAt for chronological sorting
            },
            {
                // UNIQUE COMPOUND INDEX: Prevents duplicate reactions
                // One user can only have one of each emoji per message/comment/task
                fields: ['userId', 'emoji', 'messageId'],
                unique: true,
                name: 'unique_user_emoji_message'
            },
            {
                fields: ['userId', 'emoji', 'commentId'],
                unique: true,
                name: 'unique_user_emoji_comment'
            },
            {
                fields: ['userId', 'emoji', 'taskId'],
                unique: true,
                name: 'unique_user_emoji_task'
            },
            {
                // COMPOUND INDEXES for common queries
                fields: ['messageId', 'emoji'] // Get reaction counts by emoji for a message
            },
            {
                fields: ['commentId', 'emoji'] // Get reaction counts by emoji for a comment
            },
            {
                fields: ['taskId', 'emoji']    // Get reaction counts by emoji for a task
            }
        ],

        /*
        MODEL VALIDATION to ensure data integrity
        */
        validate: {
            // Custom validation: Must have exactly one target (message, comment, or task)
            hasOneTarget() {
                const targetCount = [this.messageId, this.commentId, this.taskId].filter(id => id !== null && id !== undefined).length;
                if (targetCount !== 1) {
                    throw new Error('Reaction must belong to exactly one target (message, comment, or task)');
                }
            },

            // Custom validation: Emoji format
            validEmoji() {
                if (!this.emoji || this.emoji.trim().length === 0) {
                    throw new Error('Emoji cannot be empty');
                }
                
                // Basic check for emoji-like characters (this is simplified)
                const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
                if (!emojiRegex.test(this.emoji)) {
                    // Allow some common text-based reactions for flexibility
                    const allowedTextReactions = ['+1', '-1', ':)', ':(', ':D', ':P'];
                    if (!allowedTextReactions.includes(this.emoji)) {
                        console.warn(`Warning: "${this.emoji}" may not be a valid emoji`);
                    }
                }
            }
        },

        /*
        HOOKS - Automatically called during lifecycle events
        */
        hooks: {
            // Before creating a reaction
            beforeCreate: async (reaction, options) => {
                // Auto-detect reaction type based on emoji
                if (!reaction.reactionType && reaction.emoji) {
                    const emojiCategories = {
                        like: ['👍', '✅', '💯', '👏', '🙌'],
                        love: ['❤️', '😍', '🥰', '💖', '💕', '😘'],
                        laugh: ['😂', '🤣', '😄', '😆', '😁', '🙃'],
                        angry: ['😡', '😤', '👎', '😠', '🤬'],
                        sad: ['😢', '😞', '😔', '💔', '😿'],
                        wow: ['😮', '🤯', '😲', '🔥', '⚡', '🌟'],
                        care: ['🤗', '💪', '🤝', '👊', '🙏', '💛']
                    };

                    for (const [type, emojis] of Object.entries(emojiCategories)) {
                        if (emojis.includes(reaction.emoji)) {
                            reaction.reactionType = type;
                            break;
                        }
                    }

                    if (!reaction.reactionType) {
                        reaction.reactionType = 'custom';
                    }
                }
            },

            // After creating a reaction
            afterCreate: async (reaction, options) => {
                console.log(`User ${reaction.userId} added ${reaction.emoji} reaction`);
            },

            // Before destroying a reaction
            beforeDestroy: async (reaction, options) => {
                console.log(`Removing ${reaction.emoji} reaction by user ${reaction.userId}`);
            }
        }
    });

    return Reaction;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    emoji VARCHAR(10) NOT NULL COMMENT 'The emoji character representing the reaction',
    reactionType ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow', 'care', 'custom') COMMENT 'Optional classification of reaction type for filtering and analytics',
    userId INT NOT NULL COMMENT 'Foreign key to users table - ID of user who added this reaction',
    messageId INT COMMENT 'Foreign key to messages table - ID of message this reaction is on',
    commentId INT COMMENT 'Foreign key to comments table - ID of comment this reaction is on',
    taskId INT COMMENT 'Foreign key to tasks table - ID of task this reaction is on',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    
    INDEX idx_reactions_userId (userId),
    INDEX idx_reactions_messageId (messageId),
    INDEX idx_reactions_commentId (commentId),
    INDEX idx_reactions_taskId (taskId),
    INDEX idx_reactions_emoji (emoji),
    INDEX idx_reactions_reactionType (reactionType),
    INDEX idx_reactions_createdAt (createdAt),
    INDEX idx_reactions_messageId_emoji (messageId, emoji),
    INDEX idx_reactions_commentId_emoji (commentId, emoji),
    INDEX idx_reactions_taskId_emoji (taskId, emoji),
    
    UNIQUE INDEX unique_user_emoji_message (userId, emoji, messageId),
    UNIQUE INDEX unique_user_emoji_comment (userId, emoji, commentId),
    UNIQUE INDEX unique_user_emoji_task (userId, emoji, taskId)
);

HOW TO USE THIS MODEL:

// Add a reaction to a message (toggle behavior)
const result = await Reaction.addReaction(userId, '👍', 'message', messageId);
console.log(result.action); // 'added' or 'removed'

// Get all reactions for a message
const reactions = await Reaction.getReactionsFor('message', messageId);

// Get reaction summary with counts
const summary = await Reaction.getReactionSummary('comment', commentId);
// Result: [{ emoji: '👍', count: 5 }, { emoji: '❤️', count: 3 }]

// Get user's reactions on a specific item
const userReactions = await Reaction.getUserReactions(userId, 'task', taskId);

// Remove a specific reaction
const removed = await Reaction.removeReaction(userId, '👍', 'message', messageId);

// Get popular reactions across the system
const popular = await Reaction.getPopularReactions(5);

// Get user's reaction statistics
const stats = await Reaction.getUserReactionStats(userId);

// Get recent reactions on an item
const recent = await Reaction.getReactionsByPeriod('message', messageId, '24h');

// Use instance methods
const target = reaction.getReactionTarget(); // { type: 'message', id: 123 }
const isPositive = reaction.isPositive(); // true/false
const category = reaction.getEmojiCategory(); // 'approval', 'love', etc.

// Get reaction leaderboard
const leaderboard = await Reaction.getReactionLeaderboard(10);

INTEGRATION WITH OTHER MODELS:

// In Message model - add this to associate method:
Message.hasMany(models.Reaction, {
    foreignKey: 'messageId',
    as: 'reactions',
    onDelete: 'CASCADE'
});

// In Comment model - add this to associate method:
Comment.hasMany(models.Reaction, {
    foreignKey: 'commentId',
    as: 'reactions',
    onDelete: 'CASCADE'
});

// In Task model - add this to associate method:
Task.hasMany(models.Reaction, {
    foreignKey: 'taskId',
    as: 'reactions',
    onDelete: 'CASCADE'
});

// In User model - add this to associate method:
User.hasMany(models.Reaction, {
    foreignKey: 'userId',
    as: 'reactions',
    onDelete: 'CASCADE'
});

// Query with reactions included:
const messageWithReactions = await Message.findByPk(messageId, {
    include: [{
        model: Reaction,
        as: 'reactions',
        include: [{
            model: User,
            as: 'reactor',
            attributes: ['id', 'name', 'avatar']
        }]
    }]
});
*/