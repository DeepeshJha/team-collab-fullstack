# Team Collab Fullstack Platform

## What Does the Application Do?

**Team Collab Fullstack Platform** is a comprehensive solution for team collaboration, productivity, and communication. It enables users to manage projects, tasks, files, and team interactions in real-time, with robust security, scalability, and automation features. The platform is designed for modern teams and organizations to streamline workflows and enhance productivity.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL (v8.0+)
- npm or yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd team-collab-fullstack/backend
npm install
```

### 2. Database Setup
```bash
# Create your .env file with database credentials
cp .env.example .env

# Run the automated database setup
npm run setup-db
```

### 3. Start Development Server
```bash
npm run dev
```

Your backend API will be available at `http://localhost:5000`

---

## Application Features & Capabilities

- **User Management**
  - Registration, login, password reset
  - Social login (Google, GitHub)
  - Role-based access (Admin, Member, Guest)
  - User profile management

- **Authentication & Authorization**
  - JWT-based authentication
  - OAuth2 support
  - Secure API endpoints

- **Real-time Communication**
  - Group and private chat (Socket.IO)
  - Real-time notifications (web push, email)
  - Typing indicators, message read receipts

- **Task & Project Management**
  - Create, update, delete tasks and projects
  - Assign tasks to users
  - Kanban board and calendar views
  - Commenting and activity tracking

- **File Sharing & Storage**
  - Upload and download files (AWS S3, local)
  - File versioning and previews
  - Secure file access

- **Activity Feed & Audit Logs**
  - Real-time updates on user and team activities
  - Audit logs for admin review

- **Email Integration**
  - Transactional emails (invitations, notifications, password reset)
  - Bulk email support via queues

- **Queue & Background Jobs**
  - Task queues for emails, notifications, file processing (BullMQ, Redis)
  - Scalable background job handling

- **Admin Dashboard**
  - User and team management
  - Analytics and reporting
  - System health monitoring

- **API Documentation**
  - Interactive API docs (Swagger/OpenAPI)

- **Testing & Quality Assurance**
  - Unit, integration, and end-to-end tests (Jest, Cypress)
  - Automated CI/CD pipelines

- **Monitoring & Logging**
  - Application and error logging (Winston, Morgan)
  - Performance monitoring (Prometheus, Grafana)
  - Error tracking (Sentry)

- **Security**
  - Input validation, rate limiting, Helmet for HTTP headers
  - Secure file and data access

- **Internationalization (i18n)**
  - Multi-language support for global teams

- **Additional Functionalities**
  - User invitations and onboarding
  - Team creation and management
  - Customizable notification settings
  - Advanced search and filtering
  - Data export/import (CSV, Excel)
  - Mobile-friendly responsive design
  - Integration with third-party services (Google Calendar, Slack, etc.)
  - Dark mode and accessibility options

---

## 🗄️ Database Architecture

### Models & Relationships
- **User** - Authentication, profiles, and permissions
- **Team** - Team management and membership
- **Project** - Project organization within teams
- **Task** - Task management with assignments and status tracking
- **Message** - Team communication and messaging
- **Comment** - Discussion threads on tasks and projects
- **Attachment** - File uploads and document management
- **Reaction** - Emoji reactions for messages and comments

### Database Features
- **Automated Setup** - One-command database initialization
- **Smart Relationships** - Comprehensive foreign key relationships between all models
- **Data Integrity** - Proper constraints, indexes, and validation
- **Environment Support** - Development, testing, and production configurations
- **Migration Ready** - Sequelize ORM with migration support for production

### Database Commands
```bash
# Initial setup (creates database + tables)
npm run setup-db

# Test database connection
node src/config/test-connection.js

# Reset database (development only)
npm run setup-db --force
```

---

## Tech Stack

### Backend (Node.js, Express)
- **Framework:** Express.js (REST API)
- **Database:** MySQL with Sequelize ORM
- **Real-time:** Socket.IO
- **Authentication:** JWT, Passport.js
- **Queue System:** BullMQ/Redis
- **Email:** Nodemailer/SendGrid
- **API Docs:** Swagger/OpenAPI
- **Logging:** Winston/Morgan
- **Security:** Helmet, validation, rate limiting
- **DevOps:** Docker, automated database setup

### Frontend (Angular)
- Angular 17+
- RxJS (reactive programming)
- Angular Material/Tailwind (UI)
- ngx-translate (i18n)
- Service Workers (PWA, notifications)
- Cypress/Jasmine/Karma (testing)

### DevOps & Tools
- GitHub Actions (CI/CD)
- Docker Compose
- Nginx (reverse proxy)
- Prometheus/Grafana (monitoring)
- Sentry (error tracking)

---

## 🛠️ Development Setup

### Environment Configuration
Create a `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=team_collab_dev
DB_PORT=3306

# Application Configuration
NODE_ENV=development
PORT=5000
```

### Project Structure
```
backend/
├── src/
│   ├── models/          # Sequelize models (User, Team, Project, etc.)
│   ├── controllers/     # API endpoint handlers
│   ├── routes/          # Express route definitions
│   ├── middlewares/     # Custom middleware functions
│   ├── config/          # Database and app configuration
│   └── app.js          # Main application entry point
├── scripts/
│   └── setup-database.js  # Automated database setup
└── tests/              # Test files
```

### Database Setup Details
The automated setup script (`scripts/setup-database.js`) handles:
- ✅ MySQL server connection
- ✅ Database creation with proper charset (utf8mb4)
- ✅ Sequelize connection testing
- ✅ Table creation from all models
- ✅ Relationship setup and foreign keys
- ✅ Development-friendly error handling

---

## ✅ Completed Features

### Database & Models ✅
- Complete 8-model system with relationships
- Automated database setup and configuration
- Production-safe startup patterns
- Environment-specific configurations

### Next Development Steps

1. ⏳ **API Endpoints** - RESTful APIs for all models
2. ⏳ **Authentication System** - JWT-based auth with role management
3. ⏳ **Real-time Features** - Socket.IO for live updates
4. ⏳ **File Management** - Upload/download with proper storage
5. ⏳ **Testing Suite** - Comprehensive test coverage
6. ⏳ **API Documentation** - Interactive Swagger docs
7. ⏳ **Frontend Integration** - Angular frontend connection
8. ⏳ **Production Deployment** - Docker and CI/CD setup

---

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run start        # Start production server

# Database
npm run setup-db     # Initialize database and create tables
npm run test-db      # Test database connection

# Testing
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report

# Utilities
npm run lint         # Check code style
npm run lint:fix     # Auto-fix linting issues
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Run `npm test` before submitting PRs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support

If you have any questions or run into issues:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include error messages, environment details, and steps to reproduce

---

## 🎯 Project Status

**Current Phase:** Database Architecture & Setup ✅  
**Next Phase:** API Development & Authentication  
**Overall Progress:** Foundation Complete - Ready for Feature Development

---

*Built with ❤️ for modern team collaboration*
