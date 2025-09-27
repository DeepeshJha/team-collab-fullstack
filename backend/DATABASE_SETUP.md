# Database Setup Guide

This guide explains how to set up the MySQL database for the Team Collaboration application.

## 🚀 Quick Start (Automatic Setup)

The easiest way is to let the application create the database automatically:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=team_collab_db
```

### 3. Start the Application
```bash
npm start
```

The application will automatically:
- ✅ Create the database if it doesn't exist
- ✅ Create all tables from your models
- ✅ Start the server

## 📋 Manual Database Setup

If you prefer manual setup or need more control:

### Option 1: Full Setup Script
```bash
# Basic setup (creates database, tables, and seeds data)
npm run setup-db

# Force reset (drops and recreates everything)
npm run reset-db

# Setup without initial data
npm run setup-db-no-seed
```

### Option 2: Environment-Specific Setup
```bash
# Setup for development
npm run setup-dev

# Setup for testing
npm run setup-test

# Setup for production
npm run setup-prod
```

### Option 3: Manual MySQL Commands
```sql
-- 1. Connect to MySQL
mysql -u root -p

-- 2. Create database
CREATE DATABASE team_collab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Create user (optional)
CREATE USER 'team_collab_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON team_collab_db.* TO 'team_collab_user'@'localhost';
FLUSH PRIVILEGES;

-- 4. Exit MySQL
EXIT;
```

## 🔧 Configuration Options

### Environment Variables (.env)
```bash
# Required Database Settings
DB_HOST=localhost          # MySQL server host
DB_PORT=3306              # MySQL server port
DB_USER=root              # MySQL username
DB_PASSWORD=password      # MySQL password
DB_NAME=team_collab_db    # Database name

# Optional Settings
NODE_ENV=development      # Environment (development/test/production)
PORT=5000                # Server port
```

### Multiple Environments
You can set up different databases for different environments:

```bash
# Development
DB_NAME=team_collab_dev

# Testing
DB_NAME=team_collab_test

# Production
DB_NAME=team_collab_prod
```

## 📊 Database Structure

The application creates these tables automatically:

### Core Tables
- **users** - User accounts and authentication
- **teams** - Team organization and membership
- **projects** - Project management and tracking
- **tasks** - Individual tasks and assignments

### Communication Tables
- **messages** - Team chat and communication
- **comments** - Discussion threads on tasks/projects
- **reactions** - Emoji reactions on messages/comments

### File Management
- **attachments** - File uploads and management

### Relationships
All tables are connected with proper foreign keys and indexes for optimal performance.

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Cannot connect to MySQL"
```bash
# Check if MySQL is running
# Windows:
net start mysql

# Mac:
brew services start mysql

# Linux:
sudo systemctl start mysql
```

#### 2. "Access denied for user"
- Check username and password in .env file
- Make sure the user has proper permissions
- Try connecting with MySQL Workbench first

#### 3. "Database does not exist"
- Run `npm run setup-db` to create it
- Or create manually: `CREATE DATABASE team_collab_db;`

#### 4. "Table doesn't exist"
- Run `npm run setup-db` to sync models
- Or restart the application (auto-sync enabled)

### Advanced Troubleshooting

#### Check Database Connection
```bash
# Test connection manually
node src/config/test-connection.js
```

#### Reset Everything
```bash
# Drop and recreate all tables
npm run reset-db
```

#### Check Tables
```sql
-- Connect to database
USE team_collab_db;

-- List all tables
SHOW TABLES;

-- Check specific table structure
DESCRIBE users;
```

## 🔐 Security Considerations

### Development
- Use simple passwords for local development
- Database user can be 'root' for convenience

### Production
- Create dedicated database user with limited permissions
- Use strong passwords
- Consider database connection encryption
- Regularly backup the database

### Example Production Setup
```sql
-- Create dedicated user
CREATE USER 'team_collab_app'@'%' IDENTIFIED BY 'very_secure_password_here';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON team_collab_prod.* TO 'team_collab_app'@'%';

-- Flush privileges
FLUSH PRIVILEGES;
```

## 📈 Performance Optimization

The database includes several optimizations:

### Indexes
- Foreign key indexes for faster joins
- Composite indexes for common queries
- Unique indexes to prevent duplicates

### Best Practices
- Use connection pooling (handled by Sequelize)
- Implement proper error handling
- Monitor query performance
- Regular database maintenance

## 🚀 Deployment

### Docker Setup (Optional)
```dockerfile
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: team_collab_db
      MYSQL_USER: team_collab_user
      MYSQL_PASSWORD: userpass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Cloud Deployment
For cloud deployment (AWS RDS, Google Cloud SQL, etc.):
1. Create cloud database instance
2. Update .env with cloud database credentials
3. Run setup scripts to create tables
4. Deploy application

## 📚 Additional Resources

- [Sequelize Documentation](https://sequelize.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js MySQL Best Practices](https://github.com/mysqljs/mysql#best-practices)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your .env configuration
3. Check MySQL server status
4. Review application logs for specific errors
5. Test database connection manually

Remember: The application includes automatic database setup, so most issues can be resolved by running `npm run setup-db` or restarting the application.