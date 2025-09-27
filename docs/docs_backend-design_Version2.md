# Team Collab Fullstack – Backend Design Document

## 1. Overview

This backend is built with **Node.js** and **Express**, using **MongoDB** (or PostgreSQL if preferred) for data storage. It supports RESTful APIs and real-time features (Socket.io) for chat and notifications.

---

## 2. Architecture

**Main components:**
- Express API server
- Database (MongoDB/PostgreSQL)
- Socket.io for real-time messaging
- JWT authentication & OAuth (Google)
- File storage via AWS S3 or Cloudinary

**Folder Structure:**
```
backend/
  src/
    controllers/
    models/
    routes/
    services/
    utils/
    middlewares/
  config/
  app.js
  server.js
  tests/
```

---

## 3. Major Modules

### 3.1 Authentication
- JWT-based authentication for API requests
- Google OAuth for SSO
- Password hashing (bcrypt)
- Middlewares for route protection

### 3.2 User Management
- Register, login, profile update, avatar upload
- Password reset

### 3.3 Team & Project Management
- Create, update, delete teams/projects
- Invite and manage members
- Assign roles (admin/member)

### 3.4 Channels & Messaging (Real-time)
- Create project channels (public/private)
- Send/receive messages (Socket.io)
- Attach files to messages
- Message threads/replies

### 3.5 Task Management
- Create, assign, and update tasks
- Task statuses: To-Do, In Progress, Done
- Due dates, comments, attachments

### 3.6 File Handling
- Upload/download files (AWS S3/Cloudinary)
- Attach files to messages/tasks

### 3.7 Notifications
- Real-time (Socket.io) and email (nodemailer)
- Types: mentions, task updates, invitations, etc.

---

## 4. API Endpoints (Sample)

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/reset-password`
- `GET  /api/auth/me`

**User**
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `POST /api/users/:id/avatar`

**Team**
- `POST   /api/teams`
- `GET    /api/teams/:id`
- `PATCH  /api/teams/:id`
- `DELETE /api/teams/:id`
- `POST   /api/teams/:id/invite`

**Project**
- `POST   /api/projects`
- `GET    /api/projects/:id`
- `PATCH  /api/projects/:id`
- `DELETE /api/projects/:id`

**Channel**
- `POST   /api/channels`
- `GET    /api/channels/:id`
- `PATCH  /api/channels/:id`
- `DELETE /api/channels/:id`

**Message**
- `GET    /api/channels/:id/messages`
- `POST   /api/channels/:id/messages`
- `POST   /api/messages/:id/reply`
- `POST   /api/messages/:id/attachments`

**Task**
- `POST   /api/projects/:id/tasks`
- `GET    /api/projects/:id/tasks`
- `PATCH  /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST   /api/tasks/:id/attachments`

**File**
- `POST /api/files/upload`
- `GET  /api/files/:id/download`

**Notification**
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

---

## 5. Middleware

- Authentication: JWT validation
- Authorization: Role & membership checks
- Error handling: Centralized error middleware
- File upload: Multer (or busboy)

---

## 6. Real-Time Events (Socket.io)

- `connect`, `disconnect`
- `joinChannel`, `leaveChannel`
- `newMessage`, `editMessage`, `deleteMessage`
- `typing`, `stopTyping`
- `taskUpdate`
- `notification`

---

## 7. Security

- Passwords hashed with bcrypt
- JWT tokens (short expiry, refresh support)
- Input validation (Joi/express-validator)
- Rate limiting (express-rate-limit)
- CORS configuration

---

## 8. Testing

- Unit & integration tests (Jest or Mocha)
- Supertest for API endpoint testing

---

## 9. Deployment

- Environment variables for secrets/config (dotenv)
- Dockerized for local/dev/prod
- GitHub Actions for CI/CD
- Cloud deployment: AWS/GCP/Azure

---

## 10. References

- [ER Diagram](./er-diagram.md)
- [Wireframes](./wireframes/ascii-wireframes.md)

---

**Tip:**  
Keep this document updated as backend features evolve!