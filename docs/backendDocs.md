# Backend Development Guide - Complete Reference

> **Purpose:** This document serves as a comprehensive guide for building a Node.js backend with Express, Sequelize, and JWT authentication. Written for developers at any level who want to understand modern backend development patterns and best practices.

## Table of Contents

1. [Introduction & Prerequisites](#introduction--prerequisites)
2. [Project Architecture Overview](#project-architecture-overview)  
3. [Database Layer with Sequelize](#database-layer-with-sequelize)
4. [Core Models Explained](#core-models-explained)
5. [Authentication & Security System](#authentication--security-system)
6. [API Development (Controllers & Routes)](#api-development-controllers--routes)
7. [Input Validation & Data Sanitization](#input-validation--data-sanitization)
8. [Advanced Error Handling](#advanced-error-handling)
9. [Testing Strategies](#testing-strategies)
10. [Code Organization & Best Practices](#code-organization--best-practices)
11. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
12. [Common Patterns & Solutions](#common-patterns--solutions)
13. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Introduction & Prerequisites

### What You'll Learn From This Project
- **Professional Backend Architecture** - Industry-standard project structure and patterns
- **Database Design & ORM** - Sequelize with MySQL, relationships, migrations
- **Security Implementation** - JWT authentication, password hashing, middleware protection
- **RESTful API Design** - Clean endpoints, proper HTTP status codes, error handling
- **Code Organization** - Maintainable, scalable code structure
- **Real-world Patterns** - Authentication flows, CRUD operations, middleware chains

### Prerequisites
- **JavaScript Fundamentals:**
  - ES6+ features (arrow functions, destructuring, async/await)
  - Promises and asynchronous programming
  - CommonJS modules (`require()` and `module.exports`)
- **HTTP Concepts:**
  - HTTP methods (GET, POST, PUT, DELETE)
  - Status codes (200, 201, 400, 401, 500, etc.)
  - Request/Response cycle
- **Database Basics:**
  - Tables, columns, primary keys
  - Relationships (one-to-many, many-to-many)
  - Basic SQL understanding (helpful but not required)
- **Development Environment:**
  - Node.js (v14+) and npm installed
  - MySQL server running
  - Code editor (VS Code recommended)

### Technology Stack Overview

```javascript
// Core Technologies
{
  "runtime": "Node.js",           // JavaScript runtime environment
  "framework": "Express.js",      // Web application framework
  "database": "MySQL",            // Relational database
  "orm": "Sequelize",            // Object-Relational Mapping
  "authentication": "JWT",        // JSON Web Tokens
  "passwordSecurity": "bcrypt",   // Password hashing library
  "environment": "dotenv"         // Environment variable management
}
```

### Project Benefits
- **Scalable Architecture** - Easy to add new features and models
- **Security First** - JWT authentication, password hashing, input validation
- **Developer Friendly** - Clear code organization, comprehensive error handling
- **Production Ready** - Environment configurations, proper logging, error management

---

## Project Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                        │
│                  React/Angular/Vue                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Requests (JSON)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 EXPRESS.JS SERVER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Middleware  │  │    Controllers      │  │
│  │  (API URLs) │  │ (Auth,CORS) │  │ (Business Logic)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ Sequelize ORM
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   MySQL DATABASE                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐    │
│  │  users  │ │  teams  │ │projects │ │     tasks       │    │
│  │ table   │ │  table  │ │  table  │ │    table        │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Example

```javascript
// Example: User Registration Flow
1. Frontend → POST /api/auth/register { name, email, password }
2. Express Router → /auth routes
3. Auth Middleware → Validate input, check rate limits
4. Auth Controller → Business logic (check existing user, create new user)
5. User Model → Sequelize hooks (hash password automatically)
6. MySQL Database → Store user record
7. Controller → Generate JWT token
8. Express → Return response { user, token }
9. Frontend ← Success/Error response
```

### Directory Structure Explained

```
backend/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── models/                # Database models (Sequelize)
│   │   ├── index.js          # Model loader and associations
│   │   ├── user.js           # User model with hooks
│   │   ├── team.js           # Team model
│   │   ├── project.js        # Project model
│   │   ├── task.js           # Task model
│   │   └── emailtoken.js     # Email verification & reset tokens
│   ├── controllers/           # Business logic handlers
│   │   ├── auth.js           # Authentication (login/register)
│   │   ├── user.js           # User CRUD operations
│   │   ├── team.js           # Team management
│   │   └── index.js          # Controller exports
│   ├── routes/               # API endpoint definitions
│   │   ├── index.js          # Main router
│   │   ├── auth.js           # Auth routes (/login, /register)
│   │   ├── user.js           # User routes (/users)
│   │   └── team.js           # Team routes (/teams)
│   ├── middlewares/          # Custom middleware functions
│   │   ├── auth.js           # JWT authentication middleware
│   │   ├── validation.js     # Input validation middleware
│   │   └── index.js          # Middleware exports
│   ├── utils/                # Reusable helpers & services
│   │   └── emailService.js   # Nodemailer setup & email helpers
│   └── config/               # Configuration files
│       └── config.json       # Database configurations
├── scripts/                  # Utility scripts
│   ├── setup-database.js     # Automated DB setup
│   └── setup-env.js          # Environment setup
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables
```

---

## Database Layer with Sequelize

### What is Sequelize?
Sequelize is an **Object-Relational Mapping (ORM)** library that:
- Translates JavaScript objects to SQL database operations
- Provides a JavaScript interface for database interactions
- Handles SQL query generation automatically
- Manages database connections and transactions
- Supports database migrations and seeders

### Model Definition Pattern

Every model in our application follows this pattern:

```javascript
// models/user.js - Example Model Structure
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        // Define relationships with other models
        static associate(models) {
            // User relationships defined here
        }
    }
    
    // Define table structure
    User.init({
        // Column definitions
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { len: [2, 100] }
        }
        // ... other columns
    }, {
        // Model configuration
        sequelize,
        modelName: 'User',
        tableName: 'users',
        hooks: {
            // Lifecycle hooks (beforeCreate, beforeUpdate, etc.)
        }
    });
    
    return User;
};
```

### Understanding Database Relationships

Our application uses three main relationship types:

#### 1. One-to-Many (hasMany / belongsTo)
```javascript
// Example: One User creates many Teams
User.hasMany(models.Team, {
    foreignKey: 'createdBy',
    as: 'createdTeams'
});

Team.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
});

// Usage:
const userTeams = await user.getCreatedTeams();
const teamCreator = await team.getCreator();
```

#### 2. Many-to-Many (belongsToMany)
```javascript
// Example: Users can belong to many Teams, Teams can have many Users
User.belongsToMany(models.Team, {
    through: 'TeamMembers',    // Junction table
    foreignKey: 'userId',
    otherKey: 'teamId',
    as: 'teams'
});

Team.belongsToMany(models.User, {
    through: 'TeamMembers',
    foreignKey: 'teamId',
    otherKey: 'userId',
    as: 'members'
});

// Usage:
await user.addTeam(teamId);                    // Add user to team
const userTeams = await user.getTeams();       // Get user's teams
const teamMembers = await team.getMembers();   // Get team members
```

### Database Models in Our Application

#### User Model
```javascript
// Purpose: Authentication, user profiles, permissions
{
  id: "Auto-increment primary key",
  name: "User's full name",
  email: "Unique email for login",
  password: "Hashed password (never plain text)",
  avatar: "Profile picture URL (optional)",
  role: "admin | member | viewer",
  isActive: "Account status (active/inactive)",
  createdAt: "Account creation timestamp",
  updatedAt: "Last modification timestamp"
}

// Relationships:
// - Creates many teams (hasMany Team)
// - Belongs to many teams (belongsToMany Team)
// - Creates many projects (hasMany Project)  
// - Assigned to many projects (belongsToMany Project)
// - Assigned to many tasks (hasMany Task)
// - Sends many messages (hasMany Message)
```

#### Team Model
```javascript
// Purpose: Group users together for collaboration
{
  id: "Auto-increment primary key",
  name: "Team name",
  description: "Team description",
  createdBy: "Foreign key to User (creator)",
  isActive: "Team status",
  createdAt: "Creation timestamp",
  updatedAt: "Last modification timestamp"
}

// Relationships:
// - Belongs to one creator (belongsTo User)
// - Has many members (belongsToMany User)
// - Has many projects (hasMany Project)
```

### Sequelize Hooks (Lifecycle Events)

Hooks are functions that run automatically at specific points in the model lifecycle:

```javascript
// Example: Password hashing hooks in User model
hooks: {
    // Runs before creating a new user
    beforeCreate: async (user, options) => {
        user.password = await bcrypt.hash(user.password, 10);
    },
    
    // Runs before updating a user
    beforeUpdate: async (user, options) => {
        if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
        }
    }
}

// Common hooks:
// - beforeValidate / afterValidate
// - beforeCreate / afterCreate  
// - beforeUpdate / afterUpdate
// - beforeDestroy / afterDestroy
```

---

## Core Models Explained

This section provides detailed documentation of each major model in the application, explaining their purpose, relationships, and usage patterns.

### Team Model

#### What is the Team Model?
The Team model represents groups of users working together on projects. Think of it like a department in a company or a squad in a sports team.

#### Real-World Examples
- **Frontend Development Team** - handles website user interface
- **Marketing Team** - manages campaigns and promotion
- **Design Team** - creates visual assets and user experience
- **Backend Team** - manages servers and databases

#### Team Model Schema
```javascript
// models/team.js
{
  id: "Auto-increment primary key",
  name: "Team name (required)",
  description: "Detailed team description",
  descriptionRich: "Rich text description with formatting",
  createdBy: "Foreign key - User who created the team",
  updatedBy: "Foreign key - User who last updated",
  isPrivate: "Boolean - Is team private or public",
  visibility: "public | private | restricted",
  department: "Team department/category",
  tags: "JSON array of team tags",
  icon: "Team icon/logo URL",
  color: "Hex color for team branding",
  settings: "JSON object for team settings",
  createdAt: "Creation timestamp",
  updatedAt: "Last modification timestamp"
}
```

#### Team Relationships
```javascript
// Team Creator (One-to-One)
Team.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
// Usage: const creator = await team.getCreator();

// Team Members (Many-to-Many)
Team.belongsToMany(User, { 
    through: 'TeamMembers',
    foreignKey: 'teamId',
    otherKey: 'userId',
    as: 'members'
});
// Usage: const members = await team.getMembers();
// Usage: await team.addMember(userId);

// Team Projects (One-to-Many)
Team.hasMany(Project, { 
    foreignKey: 'teamId',
    as: 'projects'
});
// Usage: const projects = await team.getProjects();
```

#### Team Controller Examples
```javascript
// controllers/team.js
const { Team, User, Project } = require('../models');

// Get all teams for current user
const getUserTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get teams where user is creator OR member
        const teams = await Team.findAll({
            where: {
                [Op.or]: [
                    { createdBy: userId },
                    { '$members.id$': userId }
                ]
            },
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
            ],
            distinct: true
        });
        
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
    }
};

// Get team with all details
const getTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;
        
        const team = await Team.findByPk(teamId, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'members', attributes: ['id', 'name', 'email'] },
                { 
                    model: Project, 
                    as: 'projects',
                    attributes: ['id', 'title', 'status'],
                    limit: 10
                }
            ]
        });
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch team', error: error.message });
    }
};

// Create new team
const createTeam = async (req, res) => {
    try {
        const { name, description, isPrivate, visibility } = req.body;
        
        // Validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Team name must be at least 2 characters' });
        }
        
        // Create team
        const team = await Team.create({
            name,
            description,
            isPrivate: isPrivate || false,
            visibility: visibility || 'public',
            createdBy: req.user.id
        });
        
        // Add creator as member
        await team.addMember(req.user.id);
        
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create team', error: error.message });
    }
};

// Add member to team
const addTeamMember = async (req, res) => {
    try {
        const { teamId, userId } = req.body;
        
        // Verify team exists and user has permission
        const team = await Team.findByPk(teamId);
        if (!team || team.createdBy !== req.user.id) {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        // Add member
        await team.addMember(userId);
        
        res.json({ message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add member', error: error.message });
    }
};
```

### Project Model

#### What is the Project Model?
Projects represent specific work items or initiatives that teams undertake. They organize tasks and enable tracking of progress toward goals.

#### Real-World Examples
- **Website Redesign Project** - redesigning company website
- **Mobile App Launch** - releasing new mobile application
- **API Integration Project** - integrating third-party services
- **Database Migration** - migrating legacy systems

#### Project Model Schema
```javascript
// models/project.js
{
  id: "Auto-increment primary key",
  title: "Project title (required)",
  description: "Project description",
  descriptionRich: "Rich text description",
  teamId: "Foreign key - Which team owns this project",
  createdBy: "Foreign key - User who created the project",
  status: "active | completed | on-hold | archived",
  priority: "low | medium | high | critical",
  startDate: "Project start date",
  endDate: "Project end date",
  budget: "Project budget amount",
  completionPercentage: "Calculated progress (0-100)",
  visibility: "public | team-only | restricted",
  tags: "JSON array of project tags",
  createdAt: "Creation timestamp",
  updatedAt: "Last modification timestamp"
}
```

#### Project Relationships
```javascript
// Belongs to Team
Project.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Belongs to Creator (User)
Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Has many Tasks
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });

// Has many assigned Users (Many-to-Many)
Project.belongsToMany(User, {
    through: 'ProjectAssignees',
    foreignKey: 'projectId',
    otherKey: 'userId',
    as: 'assignees'
});

// Has many Comments
Project.hasMany(Comment, { foreignKey: 'projectId', as: 'comments' });
```

#### Project Helper Methods
```javascript
// Calculate project completion percentage
async getCompletionPercentage() {
    const tasks = await this.getTasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
}

// Check if project is overdue
isOverdue() {
    if (!this.endDate) return false;
    return new Date() > new Date(this.endDate) && 
           this.status !== 'completed' && 
           this.status !== 'archived';
}

// Get days remaining
getDaysRemaining() {
    if (!this.endDate) return null;
    const today = new Date();
    const due = new Date(this.endDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

#### Project Controller Examples
```javascript
// Get projects by team
const getTeamProjects = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { status, priority, page = 1, limit = 10 } = req.query;
        
        const whereClause = { teamId };
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        
        const projects = await Project.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: Task, as: 'tasks', attributes: ['id', 'title', 'status'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });
        
        // Add completion percentage to each project
        const projectsWithCompletion = await Promise.all(
            projects.map(async (project) => {
                const completion = await project.getCompletionPercentage();
                return { ...project.toJSON(), completionPercentage: completion };
            })
        );
        
        res.json(projectsWithCompletion);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
    }
};
```

### Task Model

#### What is the Task Model?
Tasks are individual units of work within projects. They represent specific actions or deliverables that team members need to complete.

#### Real-World Examples
- **Implement Login Feature** - coding task
- **Design Dashboard Mockups** - design task
- **Write API Documentation** - documentation task
- **Test payment integration** - testing task

#### Task Model Schema
```javascript
// models/task.js
{
  id: "Auto-increment primary key",
  title: "Task title (required)",
  description: "Task description",
  projectId: "Foreign key - Which project this task belongs to",
  teamId: "Foreign key - Optional direct team assignment",
  assignedTo: "Foreign key - User responsible for task",
  createdBy: "Foreign key - User who created the task",
  status: "todo | in-progress | review | completed | blocked | cancelled",
  priority: "low | medium | high | critical",
  dueDate: "When task should be completed",
  estimatedHours: "Estimated time to complete (in hours)",
  actualHours: "Actual time spent (in hours)",
  completionPercentage: "Task progress (0-100)",
  subtasks: "JSON array of subtasks",
  tags: "JSON array of task tags",
  attachments: "JSON array of attachment references",
  createdAt: "Creation timestamp",
  updatedAt: "Last modification timestamp"
}
```

#### Task Relationships
```javascript
// Belongs to Project
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Belongs to Team (optional)
Task.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Belongs to Assignee (User)
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Belongs to Creator (User)
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Has many Comments
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });

// Has many Attachments
Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments' });

// Has many Reactions (emoji reactions)
Task.hasMany(Reaction, { foreignKey: 'taskId', as: 'reactions' });
```

#### Task Helper Methods
```javascript
// Check if task is overdue
isOverdue() {
    if (!this.dueDate) return false;
    return new Date() > new Date(this.dueDate) && 
           !['completed', 'cancelled'].includes(this.status);
}

// Days until due
getDaysUntilDue() {
    if (!this.dueDate) return null;
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get task age in days
getAgeInDays() {
    const today = new Date();
    const created = new Date(this.createdAt);
    const diffTime = today - created;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
```

#### Task Controller Examples
```javascript
// Get tasks for user (assigned to them)
const getUserTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, dueDate, page = 1, limit = 20 } = req.query;
        
        const whereClause = { assignedTo: userId };
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        if (dueDate) whereClause.dueDate = { [Op.lt]: new Date(dueDate) };
        
        const tasks = await Task.findAll({
            where: whereClause,
            include: [
                { model: Project, as: 'project', attributes: ['id', 'title'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: Comment, as: 'comments', limit: 3 }
            ],
            order: [
                ['priority', 'DESC'],
                ['dueDate', 'ASC']
            ],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });
        
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
};

// Update task status
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, completionPercentage } = req.body;
        
        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // Check permission (owner or project creator)
        if (task.assignedTo !== req.user.id && task.createdBy !== req.user.id) {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        await task.update({ 
            status, 
            completionPercentage: completionPercentage || task.completionPercentage 
        });
        
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
};
```

### Message Model

#### What is the Message Model?
Messages enable real-time team communication within projects and teams. They support rich text, attachments, reactions, and threaded conversations.

#### Real-World Examples
- **Team Announcements** - important updates for the team
- **Project Discussions** - discussing project progress and decisions
- **Quick Questions** - asking teammates about specific tasks
- **File Sharing** - sharing documents, images, and resources

#### Message Model Schema
```javascript
// models/message.js
{
  id: "Auto-increment primary key",
  content: "Message text content",
  contentRich: "Rich text version with formatting",
  senderId: "Foreign key - User who sent the message",
  teamId: "Foreign key - Team chat this belongs to",
  projectId: "Foreign key - Optional project context",
  parentId: "Foreign key - Parent message (for replies/threads)",
  messageType: "text | announcement | system | pin",
  isEdited: "Boolean - Has message been edited",
  editedAt: "Timestamp of last edit",
  isSystemMessage: "Boolean - System generated message",
  isPinned: "Boolean - Is message pinned",
  mentions: "JSON array of mentioned user IDs",
  attachments: "JSON array of attachment references",
  createdAt: "Creation timestamp",
  updatedAt: "Last modification timestamp"
}
```

#### Message Relationships
```javascript
// Belongs to Sender (User)
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Belongs to Team
Message.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Belongs to Parent Message (for replies)
Message.belongsTo(Message, { foreignKey: 'parentId', as: 'parentMessage' });

// Has many Replies
Message.hasMany(Message, { foreignKey: 'parentId', as: 'replies' });

// Has many Reactions (emoji reactions)
Message.hasMany(Reaction, { foreignKey: 'messageId', as: 'reactions' });

// Has many Attachments
Message.hasMany(Attachment, { foreignKey: 'messageId', as: 'attachments' });
```

#### Message Helper Methods
```javascript
// Check if message can be edited (within time limit)
canEdit(userId, timeLimit = 15) { // 15 minutes default
    if (this.senderId !== userId) return false;
    if (this.isEdited) return false;
    
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
    
    if (diffSeconds < 60) return 'now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return messageTime.toLocaleDateString();
}
```

#### Message Controller Examples
```javascript
// Get team messages (with pagination and filtering)
const getTeamMessages = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { page = 1, limit = 50, searchTerm } = req.query;
        
        const whereClause = { 
            teamId,
            parentId: null // Only root messages, not replies
        };
        
        if (searchTerm) {
            whereClause[Op.or] = [
                { content: { [Op.like]: `%${searchTerm}%` } },
                { contentRich: { [Op.like]: `%${searchTerm}%` } }
            ];
        }
        
        const { count, rows } = await Message.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
                { 
                    model: Message, 
                    as: 'replies',
                    include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
                },
                { model: Reaction, as: 'reactions', attributes: ['id', 'emoji', 'userId'] },
                { model: Attachment, as: 'attachments' }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            distinct: true
        });
        
        res.json({
            messages: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
};

// Post a new message
const sendMessage = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { content, contentRich, mentions, attachmentIds } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        
        // Create message
        const message = await Message.create({
            content,
            contentRich,
            senderId: req.user.id,
            teamId,
            mentions: mentions || []
        });
        
        // Add attachments if provided
        if (attachmentIds && attachmentIds.length > 0) {
            const attachments = await Attachment.findAll({
                where: { id: attachmentIds }
            });
            await message.addAttachments(attachments);
        }
        
        // Return message with details
        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'sender' },
                { model: Reaction, as: 'reactions' },
                { model: Attachment, as: 'attachments' }
            ]
        });
        
        res.status(201).json(fullMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};
```

### Database Querying Patterns

#### Basic CRUD Operations
```javascript
// Create
const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'plaintext' // Will be hashed by hook
});

// Read (Find)
const users = await User.findAll();                    // All users
const user = await User.findByPk(1);                   // By primary key
const user = await User.findOne({ where: { email } }); // By condition

// Update
await user.update({ name: 'John Smith' });
// OR
await User.update(
    { name: 'John Smith' },
    { where: { id: 1 } }
);

// Delete
await user.destroy();                    // Delete instance
await User.destroy({ where: { id: 1 }}); // Delete by condition
```

#### Advanced Queries with Relationships
```javascript
// Include related data
const userWithTeams = await User.findByPk(1, {
    include: [
        { model: Team, as: 'teams' },
        { model: Project, as: 'createdProjects' }
    ]
});

// Complex filtering
const activeUsers = await User.findAll({
    where: {
        isActive: true,
        role: ['admin', 'member']
    },
    include: [{
        model: Team,
        as: 'teams',
        where: { isActive: true }
    }],
    order: [['createdAt', 'DESC']],
    limit: 10
});
```

---

## Authentication & Security System

### Security Architecture Overview

Our authentication system implements multiple layers of security:

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                       │
├─────────────────────────────────────────────────────────┤
│ 1. Input Validation    │ Validate all incoming data    │
│ 2. Rate Limiting       │ Prevent brute force attacks   │
│ 3. Password Hashing    │ bcrypt with salt rounds       │
│ 4. JWT Authentication  │ Stateless token-based auth    │
│ 5. Route Protection    │ Middleware for secure routes  │
│ 6. Error Handling      │ No sensitive data in errors   │
└─────────────────────────────────────────────────────────┘
```

### Password Security with bcrypt

#### Why bcrypt?
- **Salt Generation:** Creates unique salt for each password
- **Adaptive:** Configurable complexity (salt rounds)
- **Time-tested:** Industry standard for password hashing
- **Brute Force Resistant:** Intentionally slow to prevent attacks

#### Implementation Pattern
```javascript
// In User model hooks (models/user.js)
const bcrypt = require('bcrypt');

hooks: {
    beforeCreate: async (user, options) => {
        // Hash password before saving to database
        user.password = await bcrypt.hash(user.password, 10);
        // Salt rounds: 10 = good balance of security vs performance
    },
    
    beforeUpdate: async (user, options) => {
        // Only hash if password is being changed
        if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
        }
    }
}

// Password verification (in auth controller)
const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### JWT (JSON Web Tokens) Authentication

#### What is JWT?
JWT is a compact, URL-safe token format for securely transmitting information between parties.

#### JWT Structure
```
Header.Payload.Signature

// Example JWT:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxNjM0NjU0MjkwfQ.signature-hash

// Decoded Payload:
{
  "userId": 1,
  "email": "john@example.com",
  "iat": 1634567890,    // Issued at timestamp
  "exp": 1634654290     // Expiration timestamp
}
```

#### JWT Implementation in Our App
```javascript
// Token Generation (controllers/auth.js)
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { 
        userId: user.id, 
        email: user.email 
    },                                          // Payload
    process.env.JWT_SECRET || 'fallback-secret', // Secret key
    { expiresIn: '7d' }                         // Options
);

// Token Verification (middlewares/auth.js)
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user info to request
        next(); // Continue to next middleware/route
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
```

### Email Verification & Password Reset

The authentication system also includes email-based verification and password reset flows built with **Nodemailer** and a dedicated **EmailToken** model.

#### Email Service (Nodemailer)

- Location: `backend/src/utils/emailService.js`
- Uses `nodemailer.createTransport()` with a Mailtrap sandbox SMTP configuration for development.
- Provides three main helpers:
  - `generateToken(length = 32)` – creates a cryptographically secure random token used in verification and reset links.
  - `sendVerificationEmail(email, verificationLink)` – sends a welcome email containing a 24-hour verification link.
  - `sendPasswordResetEmail(email, resetLink)` – sends a password reset email with a 30-minute reset link.

These helpers are used by the auth controller so that all email formatting and SMTP logic is centralized in one place.

#### EmailToken Model

- Location: `backend/src/models/emailtoken.js`
- Table: `emailtokens`
- Purpose: Persist time-bound tokens for:
  - `verification` – email verification after registration
  - `password_reset` – password reset requests
- Key fields:
  - `userId` – foreign key to the user who owns the token
  - `token` – random 32+ character string sent in the email URL
  - `type` – `'verification' | 'password_reset'`
  - `expiresAt` – exact timestamp when the token becomes invalid

The model exposes convenience helpers like `createToken(userId, token, type, expiresAt)` to encapsulate creation logic.

#### Email Verification Flow

1. **Registration** (`POST /api/auth/register`):
    - After creating the user, the controller generates a random token using `generateToken()` and computes a 24-hour expiration.
    - It stores the token in `emailtokens` as type `verification` via `EmailToken.createToken(...)`.
    - It builds a link like `${APP_URL}/auth/verify-email/:token` and calls `sendVerificationEmail(email, verificationLink)`.
2. **User Clicks Link** (`GET /api/auth/verify-email/:token`):
    - The `verifyEmail` controller reads the `token` from the URL.
    - It looks up an `EmailToken` with that token and `type = 'verification'` and checks `expiresAt`.
    - If valid, it loads the associated user, sets `isVerified = true`, saves the user, and deletes the token.
    - If missing or expired, it returns an appropriate error (`400` / `404`).

#### Password Reset Flow

1. **Request Reset** (`POST /api/auth/forgot-password`):
    - The `forgotPassword` controller receives the user’s email.
    - It silently looks up the user; if not found, it responds with a generic message (to avoid account enumeration).
    - It deletes any existing `password_reset` tokens for that user so only one active token exists.
    - It generates a new token with `generateToken()`, sets `expiresAt` to 1 hour in the future, and creates an `EmailToken` with `type = 'password_reset'`.
    - It builds `${APP_URL}/auth/reset-password/:token` and calls `sendPasswordResetEmail(email, resetLink)`.
2. **Reset Password** (`POST /api/auth/reset-password`):
    - The `resetPassword` controller receives `{ token, password }`.
    - It validates the new password (minimum length etc.).
    - It finds the corresponding `EmailToken` with `type = 'password_reset'` and verifies that `expiresAt` is still in the future.
    - It loads the user, updates the password (the User model hook hashes it), and deletes the token.
    - Finally, it responds with a success message indicating the password was changed.

This design keeps **tokens short-lived and single-use**, separates concerns (controllers vs. email service vs. token storage), and avoids leaking whether a given email exists in the system.

### Authentication Controller Implementation

#### Registration Flow
```javascript
// controllers/auth.js - register function
const register = async (req, res) => {
    try {
        // 1. Extract and validate input
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields required' });
        }
        
        // 2. Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        
        // 3. Create user (password auto-hashed by model hook)
        const newUser = await User.create({ name, email, password });
        
        // 4. Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // 5. Return success response (exclude password)
        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

#### Login Flow
```javascript
// controllers/auth.js - login function
const login = async (req, res) => {
    try {
        // 1. Extract credentials
        const { email, password } = req.body;
        
        // 2. Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // 4. Generate token and respond
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

### Authentication Middleware

Middleware functions run between the request and response, allowing us to:
- Verify JWT tokens
- Add user information to requests  
- Protect routes from unauthorized access
- Handle authentication errors consistently

```javascript
// middlewares/auth.js
const authenticateToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        
        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Optional: Get fresh user data from database
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }
        
        // Add user info to request object
        req.user = user;
        next(); // Continue to next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Usage in routes:
router.get('/profile', authenticateToken, (req, res) => {
    // req.user is available here thanks to middleware
    res.json({ user: req.user });
});
```

---

## Input Validation & Data Sanitization

### Why Validation Matters

Input validation is critical for:
- **Security** - Prevents injection attacks and malicious data
- **Data Integrity** - Ensures database contains valid, consistent data
- **User Experience** - Provides clear feedback on what's wrong
- **API Reliability** - Prevents crashes from unexpected data formats

### Validation Strategies

#### 1. Sequelize Model-Level Validation
```javascript
// models/user.js - Validation at model definition
User.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],              // String length between 2-100
            notEmpty: true              // Cannot be empty string
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,              // Must be valid email format
            len: [5, 254]               // Valid email length
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 255],              // Password minimum 6 characters
            isStrongPassword() {        // Custom validator
                if (!/[A-Z]/.test(this.password)) {
                    throw new Error('Password must contain uppercase letter');
                }
                if (!/[0-9]/.test(this.password)) {
                    throw new Error('Password must contain number');
                }
            }
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'member', 'viewer'),
        defaultValue: 'member',
        validate: {
            isIn: [['admin', 'member', 'viewer']]
        }
    }
});
```

#### 2. Controller-Level Validation
```javascript
// controllers/user.js - Validation in business logic
const createUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        
        // Required fields
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                message: 'All fields are required',
                missingFields: {
                    name: !name,
                    email: !email,
                    password: !password,
                    confirmPassword: !confirmPassword
                }
            });
        }
        
        // Validate name
        if (name.trim().length < 2) {
            return res.status(400).json({
                message: 'Name must be at least 2 characters long'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address'
            });
        }
        
        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }
        
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one uppercase letter'
            });
        }
        
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one number'
            });
        }
        
        // Check passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match'
            });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }
        
        // All validations passed, create user
        const user = await User.create({ name, email, password });
        res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

#### 3. Middleware-Based Validation
```javascript
// middlewares/validation.js
const validateUserInput = (req, res, next) => {
    const errors = {};
    
    const { name, email, password } = req.body;
    
    // Validate name
    if (!name || name.trim().length < 2) {
        errors.name = 'Name is required and must be at least 2 characters';
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.email = 'Valid email address is required';
    }
    
    // Validate password
    if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
    }
    
    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }
    
    // Validation passed, continue
    next();
};

// Usage in routes
router.post('/users', validateUserInput, userController.createUser);
```

### Data Sanitization

Sanitization removes or escapes potentially dangerous characters:

```javascript
// utils/sanitizer.js
const sanitizeInput = (data, allowedFields = []) => {
    const sanitized = {};
    
    for (const field of allowedFields) {
        if (field in data) {
            let value = data[field];
            
            // Trim whitespace
            if (typeof value === 'string') {
                value = value.trim();
            }
            
            // Escape HTML special characters
            if (typeof value === 'string') {
                value = value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
            }
            
            sanitized[field] = value;
        }
    }
    
    return sanitized;
};

// Usage in controllers
const createTeam = async (req, res) => {
    try {
        const allowedFields = ['name', 'description', 'isPrivate'];
        const sanitizedData = sanitizeInput(req.body, allowedFields);
        
        const team = await Team.create({
            ...sanitizedData,
            createdBy: req.user.id
        });
        
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create team' });
    }
};
```

---

## Advanced Error Handling

### Error Handling Architecture

Professional error handling separates concerns across multiple layers:

```
┌──────────────────────────────────────────────────┐
│        Application Error Flow                    │
├──────────────────────────────────────────────────┤
│ 1. Controller Layer   → Throw custom errors      │
│ 2. Try/Catch Block    → Catch and format errors  │
│ 3. Error Handler      → Centralized processing   │
│ 4. Response Handler   → Return to client         │
└──────────────────────────────────────────────────┘
```

### Custom Error Classes

```javascript
// utils/AppError.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = {}) {
        super(message, 400);
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError
};
```

### Centralized Error Handler Middleware

```javascript
// middlewares/errorHandler.js
const errorHandler = (error, req, res, next) => {
    // Log error for debugging
    console.error({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    // Default error properties
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = {};
    
    // Handle custom AppError
    if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
        if (error.details) {
            details = error.details;
        }
    }
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = error.errors.map(e => ({
            field: e.path,
            value: e.value,
            message: e.message
        }));
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
        details = error.errors.map(e => ({
            field: e.path,
            message: `${e.path} already exists`
        }));
    }
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    }
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(Object.keys(details).length > 0 && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = errorHandler;
```

### Using Custom Errors in Controllers

```javascript
// controllers/user.js
const {
    ValidationError,
    NotFoundError,
    ConflictError,
    ForbiddenError
} = require('../utils/AppError');

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (isNaN(id) || id <= 0) {
            throw new ValidationError('Invalid user ID format', { id });
        }
        
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            throw new NotFoundError('User');
        }
        
        res.json(user);
    } catch (error) {
        next(error); // Pass to error handler
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError('User');
        }
        
        // Check ownership
        if (user.id !== req.user.id && req.user.role !== 'admin') {
            throw new ForbiddenError('You can only update your own profile');
        }
        
        // Check email uniqueness
        if (email && email !== user.email) {
            const existing = await User.findOne({ where: { email } });
            if (existing) {
                throw new ConflictError('Email already registered');
            }
        }
        
        await user.update(req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = { getUserById, updateUser };
```

---

## Testing Strategies

### Unit Testing with Jest

#### Setting Up Jest

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testMatch": ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
    "collectCoverageFrom": ["src/**/*.js", "!src/app.js"]
  }
}
```

#### Testing Models

```javascript
// __tests__/models/user.test.js
const { User } = require('../../src/models');
const { sequelize } = require('../../src/models');

describe('User Model', () => {
    // Setup before each test
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });
    
    // Cleanup after each test
    afterEach(async () => {
        await sequelize.close();
    });
    
    describe('User Creation', () => {
        test('should create user with valid data', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
            
            expect(user.id).toBeDefined();
            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('john@example.com');
        });
        
        test('should hash password before saving', async () => {
            const plainPassword = 'Test@123';
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: plainPassword
            });
            
            expect(user.password).not.toBe(plainPassword);
            expect(user.password.length).toBeGreaterThan(20); // bcrypt hash
        });
        
        test('should fail with invalid email', async () => {
            await expect(
                User.create({
                    name: 'John Doe',
                    email: 'invalid-email',
                    password: 'Test@123'
                })
            ).rejects.toThrow();
        });
        
        test('should enforce unique email constraint', async () => {
            await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
            
            await expect(
                User.create({
                    name: 'Jane Doe',
                    email: 'john@example.com',
                    password: 'Test@456'
                })
            ).rejects.toThrow();
        });
    });
    
    describe('User Validations', () => {
        test('should require name', async () => {
            await expect(
                User.create({
                    email: 'john@example.com',
                    password: 'Test@123'
                })
            ).rejects.toThrow();
        });
        
        test('should enforce minimum name length', async () => {
            await expect(
                User.create({
                    name: 'J',
                    email: 'john@example.com',
                    password: 'Test@123'
                })
            ).rejects.toThrow();
        });
    });
});
```

#### Testing Controllers

```javascript
// __tests__/controllers/user.test.js
const request = require('supertest');
const { app } = require('../../src/app');
const { User } = require('../../src/models');
const { sequelize } = require('../../src/models');

describe('User Controller', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });
    
    afterEach(async () => {
        await sequelize.close();
    });
    
    describe('POST /api/users - Create User', () => {
        test('should create user with valid data', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'Test@123'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.email).toBe('john@example.com');
            expect(response.body.password).toBeUndefined(); // Password should not be returned
        });
        
        test('should return 400 with missing fields', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe'
                    // Missing email and password
                });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });
        
        test('should return 400 with invalid email', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    email: 'invalid-email',
                    password: 'Test@123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('email');
        });
    });
    
    describe('GET /api/users/:id - Get User', () => {
        test('should return user with valid ID', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
            
            const response = await request(app)
                .get(`/api/users/${user.id}`);
            
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(user.id);
            expect(response.body.email).toBe('john@example.com');
        });
        
        test('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/users/99999');
            
            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });
    });
});
```

#### Testing Authentication

```javascript
// __tests__/controllers/auth.test.js
const request = require('supertest');
const { app } = require('../../src/app');
const { User } = require('../../src/models');
const { sequelize } = require('../../src/models');

describe('Authentication', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });
    
    afterEach(async () => {
        await sequelize.close();
    });
    
    describe('POST /api/auth/register', () => {
        test('should register user and return token', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'Test@123'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('john@example.com');
        });
        
        test('should not register duplicate email', async () => {
            await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
            
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Jane Doe',
                    email: 'john@example.com',
                    password: 'Test@456'
                });
            
            expect(response.status).toBe(409);
        });
    });
    
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
        });
        
        test('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'john@example.com',
                    password: 'Test@123'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
        
        test('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'john@example.com',
                    password: 'WrongPassword'
                });
            
            expect(response.status).toBe(401);
        });
        
        test('should reject non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@123'
                });
            
            expect(response.status).toBe(401);
        });
    });
    
    describe('Protected Routes', () => {
        let token;
        
        beforeEach(async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Test@123'
            });
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'john@example.com',
                    password: 'Test@123'
                });
            
            token = response.body.token;
        });
        
        test('should allow access with valid token', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
        });
        
        test('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/users');
            
            expect(response.status).toBe(401);
        });
        
        test('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer invalid-token');
            
            expect(response.status).toBe(403);
        });
    });
});
```



### Controller Pattern

Controllers contain the business logic for handling HTTP requests. They:
- Process incoming data
- Interact with database models
- Handle errors appropriately
- Return consistent responses

#### Controller Structure Pattern
```javascript
// controllers/user.js - Example CRUD Controller
const { User } = require('../models');

// GET /api/users - Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }, // Never return passwords
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/users/:id - Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// POST /api/users - Create new user
const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'Name, email, and password are required' 
            });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ 
                message: 'Email already exists' 
            });
        }
        
        // Create user
        const user = await User.create({ name, email, password });
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Export all functions
module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
```

### Router Pattern

Routes define the API endpoints and connect them to controller functions:

```javascript
// routes/user.js - RESTful User Routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticateToken } = require('../middlewares/auth');

// Public routes (no authentication required)
// None for users - all user operations require authentication

// Protected routes (authentication required)
router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.post('/', authenticateToken, userController.createUser);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
```

### RESTful API Design Principles

Our API follows REST conventions for consistent and predictable endpoints:

| HTTP Method | Endpoint | Purpose | Request Body | Response |
|------------|----------|---------|--------------|----------|
| GET | `/api/users` | Get all users | None | Array of users |
| GET | `/api/users/:id` | Get specific user | None | User object |
| POST | `/api/users` | Create new user | User data | Created user |
| PUT | `/api/users/:id` | Update user | Updated data | Updated user |
| DELETE | `/api/users/:id` | Delete user | None | Success message |

#### HTTP Status Codes Usage
```javascript
// Success responses
200 // OK - Successful GET, PUT
201 // Created - Successful POST
204 // No Content - Successful DELETE

// Client error responses  
400 // Bad Request - Invalid input data
401 // Unauthorized - Missing/invalid authentication
403 // Forbidden - Valid auth but insufficient permissions
404 // Not Found - Resource doesn't exist
409 // Conflict - Resource already exists (duplicate email)

// Server error responses
500 // Internal Server Error - Unexpected server error
```

### Error Handling Patterns

#### Consistent Error Response Format
```javascript
// Success response format
{
  "message": "Operation successful",
  "data": { /* result data */ }
}

// Error response format
{
  "message": "Human-readable error message",
  "error": "Technical error details (optional)",
  "statusCode": 400
}
```

#### Error Handling in Controllers
```javascript
const createUser = async (req, res) => {
    try {
        // ... business logic
        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        // Log error for debugging (don't expose to client)
        console.error('Create user error:', error);
        
        // Check for specific error types
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors.map(e => e.message)
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }
        
        // Generic error response
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};
```

---

## Code Organization & Best Practices

### File Organization Principles

#### 1. Separation of Concerns
Each file/folder has a single, well-defined responsibility:

```javascript
// ✅ Good: Each file has one responsibility
models/user.js          // Only User model definition
controllers/user.js     // Only User business logic  
routes/user.js         // Only User route definitions
middlewares/auth.js    // Only authentication middleware

// ❌ Bad: Mixed responsibilities
userStuff.js           // Contains model + controller + routes
```

#### 2. Consistent Naming Conventions
```javascript
// Files and folders: kebab-case or camelCase
user-controller.js  OR  userController.js
auth-middleware.js  OR  authMiddleware.js

// Variables and functions: camelCase
const getUserById = async (req, res) => {}
const isPasswordValid = await bcrypt.compare()

// Constants: UPPER_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10

// Classes and Models: PascalCase
class User extends Model {}
const UserModel = require('./user')
```

#### 3. Module Exports Pattern
```javascript
// ✅ Preferred: Object export at bottom
const getAllUsers = async (req, res) => {}
const createUser = async (req, res) => {}
const updateUser = async (req, res) => {}

module.exports = {
    getAllUsers,
    createUser,
    updateUser
};

// ❌ Avoid: Individual exports (creates repetition)
exports.getAllUsers = async (req, res) => {}
exports.createUser = async (req, res) => {}
```

### Environment Configuration

#### Environment Variables (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=team_collab_dev
DB_PORT=3306

# Application Configuration  
NODE_ENV=development
PORT=5000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Config File Structure (config/config.json)
```javascript
{
  "development": {
    "username": "root",
    "password": "password",
    "database": "team_collab_dev",  
    "host": "127.0.0.1",
    "port": 3306,
    "dialect": "mysql",
    "logging": console.log,
    "charset": "utf8mb4",
    "collate": "utf8mb4_unicode_ci"
  },
  "test": {
    "username": "root",
    "password": "password", 
    "database": "team_collab_test",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "mysql",
    "logging": false,
    "ssl": true
  }
}
```

### Code Quality Standards

#### 1. Function Documentation
```javascript
/**
 * Creates a new user account with validation and security measures
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.name - User's full name (2-100 characters)
 * @param {string} req.body.email - Valid email address (unique)
 * @param {string} req.body.password - Plain text password (will be hashed)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created user data or error
 */
const createUser = async (req, res) => {
    // Implementation
};
```

#### 2. Input Validation
```javascript
const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required'
            });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address'
            });
        }
        
        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Continue with user creation...
    } catch (error) {
        // Error handling
    }
};
```

#### 3. Async/Await Best Practices
```javascript
// ✅ Good: Proper error handling with try/catch
const getUserWithTeams = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            include: [{ model: Team, as: 'teams' }]
        });
        return user;
    } catch (error) {
        console.error('Error fetching user with teams:', error);
        throw error; // Re-throw to let caller handle
    }
};

// ✅ Good: Multiple awaits in sequence when needed
const createUserWithProfile = async (userData) => {
    try {
        const user = await User.create(userData);
        const profile = await Profile.create({ userId: user.id });
        return { user, profile };
    } catch (error) {
        // Rollback logic if needed
        throw error;
    }
};

// ❌ Avoid: Mixing promises and async/await
const badExample = async () => {
    return User.findAll().then(users => {
        // Don't mix .then() with async/await
    });
};
```

---

## Step-by-Step Implementation Guide

This section provides a complete walkthrough of implementing each component from scratch.

### Phase 1: Project Setup & Database

#### Step 1: Initialize Project
```bash
# Create project directory
mkdir team-collab-backend
cd team-collab-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express sequelize mysql2 bcrypt jsonwebtoken dotenv cors morgan

# Install development dependencies  
npm install --save-dev nodemon

# Create directory structure
mkdir -p src/{models,controllers,routes,middlewares,config}
mkdir scripts
```

#### Step 2: Setup Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "setup-db": "node scripts/setup-database.js"
  }
}
```

#### Step 3: Create Environment Configuration
```bash
# .env file
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root  
DB_PASSWORD=your_password
DB_NAME=team_collab_dev
JWT_SECRET=your-jwt-secret-key
```

#### Step 4: Database Configuration
```javascript
// config/config.json
{
  "development": {
    "username": "root",
    "password": "your_password",
    "database": "team_collab_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

### Phase 2: Database Models

#### Step 1: Create Model Index File
```javascript
// models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Auto-load all model files
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

#### Step 2: Create User Model
```javascript
// models/user.js
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // User creates many teams
            User.hasMany(models.Team, {
                foreignKey: 'createdBy',
                as: 'createdTeams'
            });
            
            // User belongs to many teams (through TeamMembers)
            User.belongsToMany(models.Team, {
                through: 'TeamMembers',
                foreignKey: 'userId',
                otherKey: 'teamId', 
                as: 'teams'
            });
        }
    }
    
    User.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 100],
                notEmpty: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                len: [5, 254]
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'member', 'viewer'),
            allowNull: false,
            defaultValue: 'member'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        hooks: {
            beforeCreate: async (user, options) => {
                user.password = await bcrypt.hash(user.password, 10);
            },
            beforeUpdate: async (user, options) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });
    
    return User;
};
```

### Phase 3: Authentication System

#### Step 1: Create Auth Controller
```javascript
// controllers/auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required'
            });
        }
        
        // Check existing user
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }
        
        // Create user (password will be hashed by hook)
        const user = await User.create({ name, email, password });
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Response
        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Response
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { register, login };
```

#### Step 2: Create Auth Middleware
```javascript
// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
        
        if (!token) {
            return res.status(401).json({
                message: 'Access token required'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'User not found or inactive'
            });
        }
        
        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired'
            });
        }
        return res.status(403).json({
            message: 'Invalid token'
        });
    }
};

module.exports = { authenticateToken };
```

### Phase 4: API Routes

#### Step 1: Create Auth Routes
```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

#### Step 2: Create Main Router
```javascript
// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./user');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString() 
    });
});

module.exports = router;
```

#### Step 3: Create Main App File
```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./models');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error:', error);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log('Database connected successfully');
        
        // Sync database (create tables)
        await db.sequelize.sync();
        console.log('Database synchronized');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
```

---

## Common Patterns & Solutions

### Authentication Patterns

#### 1. Route Protection Pattern
```javascript
// Apply authentication to all routes in a router
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Apply to all routes in this router
router.use(authenticateToken);

// Now all routes require authentication
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/account', deleteUserAccount);
```

#### 2. Role-Based Access Control
```javascript
// middlewares/auth.js - Role checking middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

// Usage in routes
router.delete('/users/:id', 
    authenticateToken, 
    requireRole(['admin']), 
    deleteUser
);

router.get('/admin/dashboard', 
    authenticateToken, 
    requireRole(['admin', 'moderator']), 
    getAdminDashboard
);
```

#### 3. Resource Ownership Validation
```javascript
// Check if user owns the resource they're trying to modify
const checkResourceOwnership = (resourceModel, foreignKey = 'userId') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const resource = await resourceModel.findByPk(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    message: 'Resource not found'
                });
            }
            
            // Check if user owns the resource or is admin
            if (resource[foreignKey] !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Access denied'
                });
            }
            
            req.resource = resource; // Add resource to request
            next();
        } catch (error) {
            res.status(500).json({
                message: 'Error checking resource ownership'
            });
        }
    };
};

// Usage
router.put('/tasks/:id', 
    authenticateToken, 
    checkResourceOwnership(Task, 'assignedTo'), 
    updateTask
);
```

### Database Query Patterns

#### 1. Pagination Pattern
```javascript
// controllers/user.js - Paginated user list
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { count, rows } = await User.findAndCountAll({
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            users: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

#### 2. Search and Filter Pattern
```javascript
const searchUsers = async (req, res) => {
    try {
        const { 
            search, 
            role, 
            isActive, 
            page = 1, 
            limit = 10 
        } = req.query;
        
        const whereClause = {};
        
        // Text search across multiple fields
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        
        // Filter by role
        if (role) {
            whereClause.role = role;
        }
        
        // Filter by active status
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }
        
        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['createdAt', 'DESC']]
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Search failed' });
    }
};
```

#### 3. Nested Relationships Pattern
```javascript
// Get user with all related data
const getUserWithDetails = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [{
                        model: Project,
                        as: 'projects',
                        include: [{
                            model: Task,
                            as: 'tasks'
                        }]
                    }]
                },
                {
                    model: Task,
                    as: 'assignedTasks',
                    where: { status: ['pending', 'in-progress'] },
                    required: false // LEFT JOIN
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user details' });
    }
};
```

### Error Handling Patterns

#### 1. Centralized Error Handler
```javascript
// middlewares/errorHandler.js
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    
    // Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        const errors = error.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(statusCode).json({ message, errors });
    }
    
    // Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    
    // Custom application errors
    if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
    }
    
    // Log error for debugging
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = errorHandler;

// app.js - Use the error handler
app.use(errorHandler);
```

#### 2. Custom Error Classes
```javascript
// utils/errors.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError
};

// Usage in controllers
const { NotFoundError } = require('../utils/errors');

const getUserById = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.json(user);
    } catch (error) {
        next(error); // Pass to error handler
    }
};
```

---

## Troubleshooting & FAQs

### Common Database Issues

#### Issue: "Access denied for user 'root'@'localhost'"
**Cause:** Incorrect MySQL credentials or permissions
**Solution:**
```bash
# Check MySQL is running
mysql --version

# Test connection
mysql -u root -p

# If forgotten password, reset it:
# 1. Stop MySQL service
# 2. Start MySQL with --skip-grant-tables
# 3. Connect and reset password:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### Issue: "Database doesn't exist" 
**Cause:** Database not created before running application
**Solution:**
```javascript
// Create database automatically in setup script
const mysql = require('mysql2/promise');

const createDatabase = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.end();
};
```

#### Issue: "Column doesn't exist" after adding new field
**Cause:** Database schema not updated
**Solution:**
```bash
# Force sync (development only - will drop existing data)
await sequelize.sync({ force: true });

# Or create proper migration
npx sequelize-cli migration:generate --name add-avatar-to-users
```

### Authentication Issues

#### Issue: "JsonWebTokenError: invalid signature"
**Cause:** JWT_SECRET mismatch or changed
**Solution:**
```bash
# Ensure consistent JWT_SECRET across environments
# Check .env file
echo $JWT_SECRET

# Regenerate secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Issue: Passwords not hashing
**Cause:** bcrypt hook not working or incorrect implementation
**Debug:**
```javascript
// Add logging to model hook
hooks: {
    beforeCreate: async (user, options) => {
        console.log('Hashing password for:', user.email);
        user.password = await bcrypt.hash(user.password, 10);
        console.log('Password hashed successfully');
    }
}
```

#### Issue: "Cannot set headers after they are sent"
**Cause:** Multiple responses sent in one request
**Solution:**
```javascript
// ❌ Bad: Missing return statements
if (!user) {
    res.status(404).json({ message: 'Not found' });
    // Missing return here!
}
res.json(user); // This will cause the error

// ✅ Good: Always return after sending response
if (!user) {
    return res.status(404).json({ message: 'Not found' });
}
return res.json(user);
```

### Performance Issues

#### Issue: Slow database queries
**Cause:** Missing indexes or N+1 query problem
**Solution:**
```javascript
// Add database indexes
indexes: [
    { fields: ['email'] },
    { fields: ['createdAt'] },
    { fields: ['role', 'isActive'] }
]

// Use eager loading to prevent N+1 queries
const users = await User.findAll({
    include: [{
        model: Team,
        as: 'teams'
    }]
});

// Instead of loading teams for each user separately
```

#### Issue: Memory leaks in development
**Cause:** Not closing database connections or event listeners
**Solution:**
```javascript
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
});
```

### Development Workflow Issues

#### Issue: Changes not reflected in database
**Cause:** Sequelize sync not working correctly
**Solution:**
```javascript
// Development: Force sync (drops and recreates tables)
if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ force: true });
    console.log('Database tables recreated');
}

// Production: Use migrations instead
npx sequelize-cli migration:generate --name create-users-table
```

#### Issue: Environment variables not loading
**Cause:** .env file not found or incorrect path
**Solution:**
```javascript
// Check if .env is loaded
console.log('DB_HOST:', process.env.DB_HOST);

// Specify .env path explicitly
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create .env.example for team members
# .env.example
NODE_ENV=development
PORT=5000
DB_HOST=localhost
# etc...
```

### Testing Your Implementation

#### Basic API Testing with curl
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Test protected route (use token from login response)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

#### Database Connection Test
```javascript
// scripts/test-connection.js
const { sequelize } = require('../src/models');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test query
        const [results] = await sequelize.query('SELECT 1 + 1 AS result');
        console.log('✅ Database query successful:', results);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
```

---

## Conclusion

This documentation covers the complete implementation of a modern Node.js backend with:

- **Security-first approach** with JWT authentication and password hashing
- **Scalable architecture** with proper separation of concerns
- **Professional code organization** following industry best practices
- **Comprehensive error handling** for production readiness
- **Real-world patterns** that can be applied to any project

### Key Takeaways

1. **Security is not optional** - Always hash passwords, validate input, and protect routes
2. **Organization matters** - Clear file structure makes code maintainable and scalable
3. **Error handling is crucial** - Proper error handling improves user experience and debugging
4. **Documentation saves time** - Good documentation helps team members and future you
5. **Patterns are reusable** - Learn these patterns once, apply them everywhere

### Next Steps for Expansion

- **Add more models** (Team, Project, Task) following the same patterns
- **Implement file uploads** with multer and cloud storage
- **Add real-time features** with Socket.IO
- **Create comprehensive testing** with Jest and Supertest  
- **Add API documentation** with Swagger/OpenAPI
- **Implement caching** with Redis for better performance

This foundation provides everything needed to build a professional, scalable backend application that can grow with your project requirements.

---

*Built with ❤️ for developers who want to understand not just what to code, but why and how to code it properly.*
