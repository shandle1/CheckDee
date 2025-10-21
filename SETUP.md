# CheckDee Setup Guide

## Overview

CheckDee (เช็คดี) is a location-based task management platform designed for field workers in Thailand. The system consists of:

1. **Backend API** - Node.js/Express with PostgreSQL
2. **Web Application** - React/TypeScript (for Admins & Managers)
3. **LIFF Mobile App** - LINE LIFF (for Field Workers)

## Current Progress

✅ **Backend API (Completed)**
- Project structure created
- Database schema designed
- Authentication system with JWT
- User management endpoints
- Database migration and seed scripts
- Dependencies installed

## Next Steps

### 1. Database Setup

First, ensure PostgreSQL is installed and running:

```bash
# macOS (with Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Or use Docker
docker run --name checkdee-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

Create the database:

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE checkdee;"

# Or using createdb
createdb -U postgres checkdee
```

Run migrations:

```bash
cd backend
npm run db:migrate
```

Seed test data:

```bash
npm run db:seed
```

### 2. Start the Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000`

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Test login with seeded user:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@checkdee.com","password":"admin123"}'
```

### 3. Build the Frontend (Next Phase)

The frontend will be a React application with:
- Dashboard for task overview
- Map view with Google Maps
- User management interface
- Task creation and assignment
- Submission review system
- Analytics and reporting

### 4. Build the LIFF App (Next Phase)

The LIFF mobile app will provide:
- LINE authentication
- GPS-based check-in
- Photo capture and upload
- Task checklist completion
- Dynamic form questions
- Real-time status updates

## Environment Configuration

### Required Services

1. **PostgreSQL Database** - Already configured for local development
2. **AWS S3** - For photo storage (configure later)
3. **LINE Developers Account** - For LIFF app and messaging (configure later)
4. **Google Maps API** - For location services (configure later)

### Environment Variables

The `.env` file in the backend directory contains all necessary configuration. Update these values as you set up each service:

- Database credentials (currently set for local development)
- JWT secrets (change in production!)
- AWS S3 credentials (when ready)
- LINE API credentials (when ready)
- Google Maps API key (when ready)

## Test Credentials

After running `npm run db:seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@checkdee.com | admin123 |
| Manager | manager@checkdee.com | manager123 |
| Field Worker | worker@checkdee.com | worker123 |

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│  Web App        │         │  LIFF App       │
│  (React)        │         │  (LINE LIFF)    │
│                 │         │                 │
│  Managers/      │         │  Field Workers  │
│  Admins         │         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │      REST API / WS        │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Backend   │
              │   API       │
              │  (Express)  │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
    │PostgreSQL│ │AWS S3  │ │LINE API│
    │          │ │Photos  │ │Notify  │
    └──────────┘ └────────┘ └────────┘
```

## Development Workflow

1. **Backend Development** ✅ (Current)
   - API endpoints
   - Authentication
   - Database models
   - Business logic

2. **Frontend Development** (Next)
   - Set up React + TypeScript + Vite
   - Create reusable components
   - Implement routing
   - Connect to API

3. **LIFF Development** (Then)
   - Set up LINE LIFF SDK
   - Implement GPS functionality
   - Build photo capture
   - Create mobile-optimized UI

4. **Integration** (Finally)
   - Connect all pieces
   - Set up cloud services
   - Deploy to production
   - Configure LINE channel

## Additional Features to Implement

### Backend (Remaining)
- [ ] Task routes and controllers
- [ ] Team management endpoints
- [ ] Submission handling
- [ ] Photo upload to S3
- [ ] LINE notification integration
- [ ] Report generation
- [ ] WebSocket events for real-time updates

### Frontend
- [ ] Authentication flow
- [ ] Dashboard with statistics
- [ ] Interactive map with task markers
- [ ] Task creation wizard
- [ ] User management interface
- [ ] Submission review interface
- [ ] Team management
- [ ] Reports and analytics

### LIFF App
- [ ] LINE login flow
- [ ] GPS location tracking
- [ ] Camera integration
- [ ] Task list view
- [ ] Check-in/out interface
- [ ] Dynamic form builder
- [ ] Offline support

## Getting Help

- Review the PRD at `/Users/steve/Documents/Cursor/Test/CheckDee (เช็คดี) - PRD.pdf`
- Check `backend/README.md` for API documentation
- Database schema: `backend/src/database/schema.sql`

## Next Command

To continue development, run:

```bash
cd /Users/steve/Documents/Cursor/Test/checkdee/backend
npm run dev
```

Then create the React frontend application.
