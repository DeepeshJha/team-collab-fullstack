/*
WHAT IS THE ATTACHMENT MODEL?
The Attachment model represents files that users upload and attach to tasks, projects, or messages.
Think of it like email attachments or Google Drive files shared in a conversation.

REAL WORLD EXAMPLES:
- Screenshots of bugs or mockups
- Documents like requirements or specifications
- Code files or patches
- Images, videos, or design assets
- PDFs, spreadsheets, or presentations

KEY FEATURES OF ATTACHMENTS:
- Belongs to a task, project, message, or comment
- Has an uploader (the user who uploaded it)
- Stores file metadata (name, size, type)
- Tracks upload date and file location
- Can be downloaded by authorized users
- Supports various file types with validation

WHAT DOES THIS FILE DO?
- Defines the structure of the attachments table in the database
- Sets up relationships with Task, Project, Message, Comment, and User models
- Provides methods to work with attachment data
- Handles file metadata and validation
- Manages file access and permissions
*/

// Import the Model class and Op (Operators) from Sequelize
// Model gives us all the database superpowers (create, find, update, delete)
// Op provides query operators like Op.like, Op.gte, etc.
const { Model, Op } = require('sequelize');

// Export a function that receives database connection and data types
// This pattern allows index.js to pass the connection when loading models
module.exports = (sequelize, DataTypes) => {
    
    // Define Attachment class that extends Sequelize's Model class
    // This gives us access to methods like Attachment.create(), Attachment.findAll(), etc.
    class Attachment extends Model {
        
        // Static method to define relationships with other models
        // Called automatically after all models are loaded
        static associate(models) {
            
            /*
            ATTACHMENT RELATIONSHIPS EXPLAINED:
            
            Think of attachments like files in a filing system:
            - "Attachment belongs to User" = Every file has an uploader
            - "Attachment belongs to Task" = Files can be attached to specific tasks
            - "Attachment belongs to Project" = Files can be project-level documents
            - "Attachment belongs to Message" = Files can be shared in chat
            - "Attachment belongs to Comment" = Files can be attached to discussions
            */
            
            // RELATIONSHIP 1: Attachment belongs to one User (uploader)
            // REAL WORLD: Every file needs someone who uploaded it
            // DATABASE: Adds 'uploadedBy' column in attachments table that references users.id
            Attachment.belongsTo(models.User, {
                foreignKey: 'uploadedBy',       // Column in attachments table storing uploader's user ID
                as: 'uploader'                  // Alias for queries: attachment.getUploader()
            });
            // USAGE: const uploader = await attachment.getUploader();
            // SQL EQUIVALENT: SELECT * FROM users WHERE id = attachment.uploadedBy;

            // RELATIONSHIP 2: Attachment belongs to one Task (optional)
            // REAL WORLD: Files can be attached to specific tasks
            // EXAMPLE: Screenshot of a bug, design mockup for a feature
            // DATABASE: Adds 'taskId' column in attachments table
            Attachment.belongsTo(models.Task, {
                foreignKey: 'taskId',           // Column in attachments table storing task's ID
                as: 'task'                      // Alias for queries: attachment.getTask()
            });
            // USAGE: const task = await attachment.getTask();

            // RELATIONSHIP 3: Attachment belongs to one Project (optional)
            // REAL WORLD: Files can be project-level documents
            // EXAMPLE: Requirements document, project charter, final deliverables
            // DATABASE: Adds 'projectId' column in attachments table
            Attachment.belongsTo(models.Project, {
                foreignKey: 'projectId',        // Column in attachments table storing project's ID
                as: 'project'                   // Alias for queries: attachment.getProject()
            });
            // USAGE: const project = await attachment.getProject();

            // RELATIONSHIP 4: Attachment belongs to one Message (optional)
            // REAL WORLD: Files can be shared in team chat messages
            // EXAMPLE: Sharing a document in team chat, sending screenshots
            // DATABASE: Adds 'messageId' column in attachments table
            Attachment.belongsTo(models.Message, {
                foreignKey: 'messageId',        // Column in attachments table storing message's ID
                as: 'message'                   // Alias for queries: attachment.getMessage()
            });
            // USAGE: const message = await attachment.getMessage();

            // RELATIONSHIP 5: Attachment belongs to one Comment (optional)
            // REAL WORLD: Files can be attached to comment discussions
            // EXAMPLE: Adding a diagram to explain a technical point
            // DATABASE: Adds 'commentId' column in attachments table
            Attachment.belongsTo(models.Comment, {
                foreignKey: 'commentId',        // Column in attachments table storing comment's ID
                as: 'comment'                   // Alias for queries: attachment.getComment()
            });
            // USAGE: const comment = await attachment.getComment();

            // RELATIONSHIP 6: Attachment belongs to one Team (optional)
            // REAL WORLD: Files can be general team resources
            // EXAMPLE: Team handbook, shared templates, meeting recordings
            // DATABASE: Adds 'teamId' column in attachments table
            Attachment.belongsTo(models.Team, {
                foreignKey: 'teamId',           // Column in attachments table storing team's ID
                as: 'team'                      // Alias for queries: attachment.getTeam()
            });
            // USAGE: const team = await attachment.getTeam();
        }

        /*
        INSTANCE METHODS SECTION
        These are functions you can call on individual attachment records
        */

        // Get human-readable file size
        getFormattedSize() {
            if (!this.fileSize) return 'Unknown size';
            
            const bytes = this.fileSize;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            
            if (bytes === 0) return '0 Bytes';
            
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Check if file is an image
        isImage() {
            if (!this.mimeType) return false;
            return this.mimeType.startsWith('image/');
        }

        // Check if file is a document
        isDocument() {
            if (!this.mimeType) return false;
            const docTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ];
            return docTypes.includes(this.mimeType);
        }

        // Check if file is a video
        isVideo() {
            if (!this.mimeType) return false;
            return this.mimeType.startsWith('video/');
        }

        // Check if file is an audio file
        isAudio() {
            if (!this.mimeType) return false;
            return this.mimeType.startsWith('audio/');
        }

        // Get file extension from filename
        getFileExtension() {
            const filename = this.originalName || this.filename;
            return filename.split('.').pop().toLowerCase();
        }

        // Check if user can download this attachment
        canUserAccess(userId) {
            // File uploader can always access
            if (this.uploadedBy === userId) return true;
            
            // TODO: Add more complex permission logic based on:
            // - Team membership
            // - Project assignment
            // - Task assignment
            // - File visibility settings
            
            return true; // For now, all authenticated users can access
        }

        // Generate download URL (placeholder - implement based on your file storage)
        getDownloadUrl() {
            // This would typically generate a signed URL for cloud storage
            // or a secure endpoint for local file serving
            return `/api/attachments/${this.id}/download`;
        }

        // Get thumbnail URL for images
        getThumbnailUrl() {
            if (!this.isImage()) return null;
            return `/api/attachments/${this.id}/thumbnail`;
        }

        // Get attachment context (what it's attached to)
        getContext() {
            if (this.taskId) return { type: 'task', id: this.taskId };
            if (this.projectId) return { type: 'project', id: this.projectId };
            if (this.messageId) return { type: 'message', id: this.messageId };
            if (this.commentId) return { type: 'comment', id: this.commentId };
            if (this.teamId) return { type: 'team', id: this.teamId };
            return { type: 'general', id: null };
        }

        /*
        STATIC METHODS SECTION
        These are functions you call on the Attachment model itself
        */

        // Get attachments for a specific task
        static async getTaskAttachments(taskId) {
            return await this.findAll({
                where: { taskId: taskId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get attachments for a specific project
        static async getProjectAttachments(projectId) {
            return await this.findAll({
                where: { projectId: projectId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get attachments for a specific message
        static async getMessageAttachments(messageId) {
            return await this.findAll({
                where: { messageId: messageId },
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'ASC']] // Message attachments in upload order
            });
        }

        // Get attachments by file type
        static async getAttachmentsByType(mimeTypePrefix, contextType, contextId) {
            const whereCondition = {
                mimeType: { [Op.like]: `${mimeTypePrefix}%` }
            };

            if (contextType && contextId) {
                whereCondition[`${contextType}Id`] = contextId;
            }

            return await this.findAll({
                where: whereCondition,
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Search attachments by filename
        static async searchAttachments(searchTerm, contextType, contextId) {
            const whereCondition = {
                [Op.or]: [
                    { originalName: { [Op.like]: `%${searchTerm}%` } },
                    { filename: { [Op.like]: `%${searchTerm}%` } }
                ]
            };

            if (contextType && contextId) {
                whereCondition[`${contextType}Id`] = contextId;
            }

            return await this.findAll({
                where: whereCondition,
                include: [
                    { 
                        model: sequelize.models.User, 
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // Get storage statistics
        static async getStorageStats(userId = null) {
            const whereCondition = userId ? { uploadedBy: userId } : {};
            
            const stats = await this.findAll({
                where: whereCondition,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalFiles'],
                    [sequelize.fn('SUM', sequelize.col('fileSize')), 'totalSize'],
                    [sequelize.fn('AVG', sequelize.col('fileSize')), 'averageSize']
                ],
                raw: true
            });

            return stats[0];
        }
    }

    // Initialize the Attachment model with its attributes (columns) and options
    Attachment.init({
        
        /*
        FILE IDENTIFICATION SECTION
        Information to identify and locate the file
        */
        
        // STORED FILENAME - The filename used to store the file on disk/cloud
        // EXAMPLE: "uuid-timestamp.jpg", "abc123-456789.pdf"
        filename: {
            type: DataTypes.STRING,         // VARCHAR(255) - system-generated filename
            allowNull: false,               // REQUIRED - every attachment needs a stored filename
            unique: true,                   // UNIQUE - no duplicate filenames in storage
            validate: {
                notEmpty: true
            },
            comment: 'System-generated filename used for file storage'
        },
        // DATABASE RESULT: filename VARCHAR(255) NOT NULL UNIQUE COMMENT 'System-generated filename used for file storage'

        // ORIGINAL FILENAME - The name the user gave the file when uploading
        // EXAMPLE: "Bug Screenshot.png", "Project Requirements.docx"
        originalName: {
            type: DataTypes.STRING,         // VARCHAR(255) - user's original filename
            allowNull: false,               // REQUIRED - preserve user's filename
            validate: {
                len: [1, 255],              // Filename must be between 1 and 255 characters
                notEmpty: true
            },
            comment: 'Original filename as provided by user when uploading'
        },
        // DATABASE RESULT: originalName VARCHAR(255) NOT NULL COMMENT 'Original filename as provided by user when uploading'

        /*
        FILE METADATA SECTION
        Technical information about the file
        */

        // FILE SIZE - Size of the file in bytes
        // EXAMPLES: 1024 (1KB), 1048576 (1MB), 5242880 (5MB)
        fileSize: {
            type: DataTypes.BIGINT,         // BIGINT - can store large file sizes
            allowNull: true,                // OPTIONAL - might not always be available
            validate: {
                min: 0,                     // File size cannot be negative
                max: 100 * 1024 * 1024     // Max 100MB (adjust based on your needs)
            },
            comment: 'File size in bytes'
        },
        // DATABASE RESULT: fileSize BIGINT COMMENT 'File size in bytes'

        // MIME TYPE - The type/format of the file
        // EXAMPLES: "image/jpeg", "application/pdf", "text/plain", "video/mp4"
        mimeType: {
            type: DataTypes.STRING,         // VARCHAR(255) - MIME type string
            allowNull: true,                // OPTIONAL - might not always be detected
            validate: {
                len: [0, 100]               // MIME type length limit
            },
            comment: 'MIME type of the file (e.g., image/jpeg, application/pdf)'
        },
        // DATABASE RESULT: mimeType VARCHAR(255) COMMENT 'MIME type of the file (e.g., image/jpeg, application/pdf)'

        // FILE PATH - Where the file is stored (local path or cloud URL)
        // EXAMPLES: "/uploads/2024/01/file.jpg", "https://s3.amazonaws.com/bucket/file.jpg"
        filePath: {
            type: DataTypes.STRING(500),    // VARCHAR(500) - longer for URLs
            allowNull: false,               // REQUIRED - need to know where file is stored
            comment: 'File storage path or URL where the file is located'
        },
        // DATABASE RESULT: filePath VARCHAR(500) NOT NULL COMMENT 'File storage path or URL where the file is located'

        /*
        FILE CLASSIFICATION SECTION
        Organizing and categorizing files
        */

        // FILE CATEGORY - High-level categorization of the file
        fileCategory: {
            type: DataTypes.ENUM('image', 'document', 'video', 'audio', 'archive', 'other'),
            allowNull: false,
            defaultValue: 'other',
            comment: 'High-level category of the file for organization and filtering'
        },
        // FILE CATEGORIES EXPLAINED:
        // - 'image': Photos, screenshots, diagrams, mockups
        // - 'document': PDFs, Word docs, spreadsheets, text files
        // - 'video': MP4, AVI, MOV files for demos or recordings
        // - 'audio': MP3, WAV files for voice notes or recordings
        // - 'archive': ZIP, RAR files containing multiple files
        // - 'other': Any file type not fitting above categories

        // VISIBILITY LEVEL - Who can access this file
        visibility: {
            type: DataTypes.ENUM('public', 'team', 'project', 'private'),
            allowNull: false,
            defaultValue: 'team',
            comment: 'Visibility level controlling who can access this file'
        },
        // VISIBILITY LEVELS EXPLAINED:
        // - 'public': Everyone in the organization can see
        // - 'team': Only team members can see
        // - 'project': Only project members can see
        // - 'private': Only uploader and explicitly granted users can see

        /*
        FOREIGN KEY SECTION
        References to other entities this attachment is related to
        */
        
        // FILE UPLOADER - Who uploaded this file
        uploadedBy: {
            type: DataTypes.INTEGER,        // INTEGER - matches User ID type
            allowNull: false,               // REQUIRED - every file must have an uploader
            references: {                   // Foreign key constraint
                model: 'users',             // References the 'users' table
                key: 'id'                   // References the 'id' column in users table
            },
            comment: 'Foreign key to users table - ID of user who uploaded this file'
        },
        // DATABASE RESULT: uploadedBy INT NOT NULL, FOREIGN KEY (uploadedBy) REFERENCES users(id)

        // TASK REFERENCE - Which task this file is attached to (optional)
        taskId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Task ID type
            allowNull: true,                // OPTIONAL - not all files are task-related
            references: {                   // Foreign key constraint
                model: 'tasks',             // References the 'tasks' table
                key: 'id'                   // References the 'id' column in tasks table
            },
            comment: 'Foreign key to tasks table - ID of task this file is attached to'
        },
        // DATABASE RESULT: taskId INT, FOREIGN KEY (taskId) REFERENCES tasks(id)

        // PROJECT REFERENCE - Which project this file is attached to (optional)
        projectId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Project ID type
            allowNull: true,                // OPTIONAL - not all files are project-related
            references: {                   // Foreign key constraint
                model: 'projects',          // References the 'projects' table
                key: 'id'                   // References the 'id' column in projects table
            },
            comment: 'Foreign key to projects table - ID of project this file is attached to'
        },
        // DATABASE RESULT: projectId INT, FOREIGN KEY (projectId) REFERENCES projects(id)

        // MESSAGE REFERENCE - Which message this file is attached to (optional)
        messageId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Message ID type
            allowNull: true,                // OPTIONAL - not all files are message attachments
            references: {                   // Foreign key constraint
                model: 'messages',          // References the 'messages' table
                key: 'id'                   // References the 'id' column in messages table
            },
            comment: 'Foreign key to messages table - ID of message this file is attached to'
        },
        // DATABASE RESULT: messageId INT, FOREIGN KEY (messageId) REFERENCES messages(id)

        // COMMENT REFERENCE - Which comment this file is attached to (optional)
        commentId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Comment ID type
            allowNull: true,                // OPTIONAL - not all files are comment attachments
            references: {                   // Foreign key constraint
                model: 'comments',          // References the 'comments' table
                key: 'id'                   // References the 'id' column in comments table
            },
            comment: 'Foreign key to comments table - ID of comment this file is attached to'
        },
        // DATABASE RESULT: commentId INT, FOREIGN KEY (commentId) REFERENCES comments(id)

        // TEAM REFERENCE - Which team this file belongs to (optional)
        teamId: {
            type: DataTypes.INTEGER,        // INTEGER - matches Team ID type
            allowNull: true,                // OPTIONAL - not all files are team-specific
            references: {                   // Foreign key constraint
                model: 'teams',             // References the 'teams' table
                key: 'id'                   // References the 'id' column in teams table
            },
            comment: 'Foreign key to teams table - ID of team this file belongs to'
        },
        // DATABASE RESULT: teamId INT, FOREIGN KEY (teamId) REFERENCES teams(id)

        /*
        METADATA SECTION
        Additional tracking and management information
        */

        // DOWNLOAD COUNT - How many times this file has been downloaded
        downloadCount: {
            type: DataTypes.INTEGER,        // INTEGER type
            defaultValue: 0,                // New files have 0 downloads
            validate: {
                min: 0                      // Download count cannot be negative
            },
            comment: 'Number of times this file has been downloaded'
        },
        // DATABASE RESULT: downloadCount INT DEFAULT 0 COMMENT 'Number of times this file has been downloaded'

        // CHECKSUM/HASH - File integrity verification
        checksum: {
            type: DataTypes.STRING(64),     // VARCHAR(64) - enough for SHA-256 hash
            allowNull: true,                // Optional field
            comment: 'File checksum/hash for integrity verification'
        },
        // DATABASE RESULT: checksum VARCHAR(64) COMMENT 'File checksum/hash for integrity verification'

        // EXPIRATION DATE - When this file should be automatically deleted
        expiresAt: {
            type: DataTypes.DATE,           // DATETIME type
            allowNull: true,                // Optional - not all files expire
            comment: 'When this file should be automatically deleted (optional)'
        }
        // DATABASE RESULT: expiresAt DATETIME COMMENT 'When this file should be automatically deleted (optional)'

    }, {
        /*
        MODEL CONFIGURATION OPTIONS
        */
        
        sequelize,                          // Database connection instance
        modelName: 'Attachment',            // Model name used internally by Sequelize
        tableName: 'attachments',           // Actual table name in database
        timestamps: true,                   // Add createdAt and updatedAt columns
        paranoid: true,                     // Enable soft deletes (adds deletedAt column)
        
        /*
        DATABASE INDEXES for better query performance
        */
        indexes: [
            {
                fields: ['uploadedBy']      // Index on uploadedBy for faster lookup of files by uploader
            },
            {
                fields: ['taskId']          // Index on taskId for faster lookup of task attachments
            },
            {
                fields: ['projectId']       // Index on projectId for faster lookup of project attachments
            },
            {
                fields: ['messageId']       // Index on messageId for faster lookup of message attachments
            },
            {
                fields: ['commentId']       // Index on commentId for faster lookup of comment attachments
            },
            {
                fields: ['teamId']          // Index on teamId for faster lookup of team files
            },
            {
                fields: ['mimeType']        // Index on mimeType for filtering by file type
            },
            {
                fields: ['fileCategory']    // Index on fileCategory for filtering by category
            },
            {
                fields: ['visibility']      // Index on visibility for access control queries
            },
            {
                fields: ['createdAt']       // Index on createdAt for chronological sorting
            },
            {
                fields: ['filename'],       // Index on filename for unique constraint and lookups
                unique: true
            },
            {
                fields: ['taskId', 'fileCategory'] // Compound index for task files by category
            }
        ],

        /*
        DEFAULT SCOPE - what gets selected by default in queries
        */
        defaultScope: {
            where: { deletedAt: null }      // Only get non-deleted attachments by default
        },
        
        /*
        NAMED SCOPES for common queries
        */
        scopes: {
            // Scope to get attachments with uploader information
            withUploader: {
                include: [{
                    model: sequelize.models.User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'avatar', 'email']
                }]
            },
            
            // Scope to get only images
            images: {
                where: { fileCategory: 'image' }
            },
            
            // Scope to get only documents
            documents: {
                where: { fileCategory: 'document' }
            },
            
            // Scope to get only videos
            videos: {
                where: { fileCategory: 'video' }
            },
            
            // Scope to get task attachments
            taskAttachments: (taskId) => ({
                where: { taskId: taskId }
            }),
            
            // Scope to get project attachments
            projectAttachments: (projectId) => ({
                where: { projectId: projectId }
            }),
            
            // Scope to get message attachments
            messageAttachments: (messageId) => ({
                where: { messageId: messageId }
            }),
            
            // Scope to get public files
            publicFiles: {
                where: { visibility: 'public' }
            },
            
            // Scope to get recent uploads (last 7 days)
            recent: {
                where: {
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            
            // Scope to get large files (over 10MB)
            largeFiles: {
                where: {
                    fileSize: {
                        [Op.gt]: 10 * 1024 * 1024 // 10MB in bytes
                    }
                }
            }
        },

        /*
        HOOKS - Automatically called during lifecycle events
        */
        hooks: {
            // Before creating an attachment
            beforeCreate: async (attachment, options) => {
                // Auto-detect file category based on MIME type
                if (!attachment.fileCategory && attachment.mimeType) {
                    if (attachment.mimeType.startsWith('image/')) {
                        attachment.fileCategory = 'image';
                    } else if (attachment.mimeType.startsWith('video/')) {
                        attachment.fileCategory = 'video';
                    } else if (attachment.mimeType.startsWith('audio/')) {
                        attachment.fileCategory = 'audio';
                    } else if (attachment.mimeType.includes('pdf') || 
                               attachment.mimeType.includes('document') ||
                               attachment.mimeType.includes('text')) {
                        attachment.fileCategory = 'document';
                    } else if (attachment.mimeType.includes('zip') ||
                               attachment.mimeType.includes('rar') ||
                               attachment.mimeType.includes('tar')) {
                        attachment.fileCategory = 'archive';
                    }
                }
                
                // Generate unique filename if not provided
                if (!attachment.filename && attachment.originalName) {
                    const timestamp = Date.now();
                    const extension = attachment.originalName.split('.').pop();
                    attachment.filename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
                }
            },

            // After creating an attachment
            afterCreate: async (attachment, options) => {
                console.log(`File "${attachment.originalName}" uploaded successfully by user ${attachment.uploadedBy}`);
            },

            // Before destroying (soft delete)
            beforeDestroy: async (attachment, options) => {
                // TODO: Add logic to actually delete the file from storage
                console.log(`File "${attachment.originalName}" marked for deletion`);
            }
        }
    });

    return Attachment;
};

/*
RESULTING SQL TABLE STRUCTURE:

CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL UNIQUE COMMENT 'System-generated filename used for file storage',
    originalName VARCHAR(255) NOT NULL COMMENT 'Original filename as provided by user when uploading',
    fileSize BIGINT COMMENT 'File size in bytes',
    mimeType VARCHAR(255) COMMENT 'MIME type of the file (e.g., image/jpeg, application/pdf)',
    filePath VARCHAR(500) NOT NULL COMMENT 'File storage path or URL where the file is located',
    fileCategory ENUM('image', 'document', 'video', 'audio', 'archive', 'other') DEFAULT 'other' COMMENT 'High-level category of the file for organization and filtering',
    visibility ENUM('public', 'team', 'project', 'private') DEFAULT 'team' COMMENT 'Visibility level controlling who can access this file',
    uploadedBy INT NOT NULL COMMENT 'Foreign key to users table - ID of user who uploaded this file',
    taskId INT COMMENT 'Foreign key to tasks table - ID of task this file is attached to',
    projectId INT COMMENT 'Foreign key to projects table - ID of project this file is attached to',
    messageId INT COMMENT 'Foreign key to messages table - ID of message this file is attached to',
    commentId INT COMMENT 'Foreign key to comments table - ID of comment this file is attached to',
    teamId INT COMMENT 'Foreign key to teams table - ID of team this file belongs to',
    downloadCount INT DEFAULT 0 COMMENT 'Number of times this file has been downloaded',
    checksum VARCHAR(64) COMMENT 'File checksum/hash for integrity verification',
    expiresAt DATETIME COMMENT 'When this file should be automatically deleted (optional)',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME,
    
    FOREIGN KEY (uploadedBy) REFERENCES users(id),
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_attachments_uploadedBy (uploadedBy),
    INDEX idx_attachments_taskId (taskId),
    INDEX idx_attachments_projectId (projectId),
    INDEX idx_attachments_messageId (messageId),
    INDEX idx_attachments_commentId (commentId),
    INDEX idx_attachments_teamId (teamId),
    INDEX idx_attachments_mimeType (mimeType),
    INDEX idx_attachments_fileCategory (fileCategory),
    INDEX idx_attachments_visibility (visibility),
    INDEX idx_attachments_createdAt (createdAt),
    UNIQUE INDEX idx_attachments_filename (filename),
    INDEX idx_attachments_taskId_fileCategory (taskId, fileCategory)
);

HOW TO USE THIS MODEL:

// Create a task attachment
const attachment = await Attachment.create({
    filename: 'uuid-123456789.jpg',
    originalName: 'Bug Screenshot.jpg',
    fileSize: 1048576, // 1MB
    mimeType: 'image/jpeg',
    filePath: '/uploads/2024/01/uuid-123456789.jpg',
    uploadedBy: 1,
    taskId: 5,
    visibility: 'team'
});

// Get all attachments for a task
const taskAttachments = await Attachment.getTaskAttachments(taskId);

// Search attachments by filename
const searchResults = await Attachment.searchAttachments('screenshot', 'task', 5);

// Get attachments by type
const images = await Attachment.getAttachmentsByType('image', 'project', projectId);

// Use scopes
const recentImages = await Attachment.scope(['recent', 'images']).findAll();
const taskFiles = await Attachment.scope('taskAttachments').call(Attachment, taskId);

// Use instance methods
const formattedSize = attachment.getFormattedSize(); // "1.5 MB"
const isImage = attachment.isImage(); // true/false
const downloadUrl = attachment.getDownloadUrl(); // "/api/attachments/123/download"
const canAccess = attachment.canUserAccess(userId); // true/false

// Update download count
await attachment.increment('downloadCount');

// Soft delete attachment
await attachment.destroy();

// Get storage statistics
const stats = await Attachment.getStorageStats(userId);
console.log(`User has ${stats.totalFiles} files using ${stats.totalSize} bytes`);
*/