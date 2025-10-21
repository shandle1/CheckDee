# CheckDee Backend API

Node.js/Express backend API for the CheckDee task management platform.

## Features

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, Team Leader, Field Worker)
- PostgreSQL database with comprehensive schema
- RESTful API endpoints
- Real-time updates via Socket.io
- Comprehensive error handling and validation
- Activity logging and audit trails

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your configuration values.

3. **Set up the database:**

   Create a PostgreSQL database:
   ```bash
   createdb checkdee
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

   This creates test users:
   - Admin: `admin@checkdee.com` / `admin123`
   - Manager: `manager@checkdee.com` / `manager123`
   - Worker: `worker@checkdee.com` / `worker123`

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` (or the PORT specified in .env)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout (log activity)
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin/Manager)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin/Manager)
- `DELETE /api/users/:id` - Delete user (Admin)

### Tasks (Coming soon)
- Task CRUD operations
- Task assignment
- Task templates

### Submissions (Coming soon)
- Submit task completion
- Photo uploads
- Check-in/out tracking

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.js  # Database connection
├── database/        # Database files
│   ├── schema.sql   # Database schema
│   ├── migrate.js   # Migration script
│   └── seed.js      # Seed script
├── middleware/      # Express middleware
│   ├── auth.js      # Authentication middleware
│   ├── errorHandler.js
│   └── validator.js
├── routes/          # API routes
│   ├── auth.routes.js
│   └── users.routes.js
├── utils/           # Utility functions
│   └── jwt.js       # JWT helpers
└── server.js        # Main application
```

## Security Features

- Helmet.js for security headers
- Password hashing with bcrypt
- JWT token authentication
- Role-based authorization
- Input validation with express-validator
- SQL injection protection via parameterized queries

## Development

- The API uses ES modules (`type: "module"`)
- All routes require authentication except `/api/auth/login` and `/api/auth/refresh`
- Role-based middleware restricts access to sensitive endpoints
- Activity logging tracks all important actions

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The database includes tables for:
- Users and Teams
- Tasks and Templates
- Task Checklists and Questions
- Task Submissions
- Submission Photos and Answers
- Task Reviews
- Activity Logs
- Notifications

See `src/database/schema.sql` for complete schema.
