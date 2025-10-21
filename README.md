# CheckDee (เช็คดี) - Location-Based Task Management Platform

A comprehensive task management platform for Thai businesses with field workers. Combines a web-based management interface with a LINE LIFF mobile app for workers.

## Project Structure

```
checkdee/
├── backend/          # Node.js/Express API server
├── frontend/         # React web application (managers/admins)
├── liff-app/         # LINE LIFF mobile app (field workers)
└── README.md
```

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Socket.io for real-time updates
- AWS S3 for photo storage

### Frontend (Web)
- React 18+ with TypeScript
- Vite build tool
- Material-UI (MUI)
- Google Maps API
- Zustand for state management

### LIFF App (Mobile)
- React 18+ with TypeScript
- LINE LIFF SDK
- Tailwind CSS
- PWA support

## Features

### Web Application
- User and team management
- Task creation with location, photos, checklists
- Interactive map dashboard
- Task review and approval
- Reporting and analytics

### LINE LIFF App
- GPS-based check-in
- Photo capture (before/after)
- Checklist completion
- Task submission
- Real-time notifications

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- AWS account (for S3)
- Google Maps API key
- LINE Developer account

### Installation

See individual README files in each directory for detailed setup instructions.

## Development Phases

- **Phase 1 (MVP)**: Core task management, check-in, photo upload
- **Phase 2**: Advanced reporting, templates, bulk operations
- **Phase 3**: Offline mode, QR check-in, advanced analytics

## License

Proprietary - All rights reserved
