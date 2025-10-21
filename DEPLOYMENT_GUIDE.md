# CheckDee - Deployment & Setup Guide

## 🚀 Quick Start on Your Local Machine

Your Supabase database is ready! Follow these steps to run CheckDee on your local computer.

---

## ✅ Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - Already set up! ✓

---

## 📦 Step 1: Clone and Install

```bash
# Clone the repository (or download it)
git clone <your-repo-url>
cd CheckDee

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install LIFF app dependencies (optional for now)
cd ../liff-app
npm install
```

---

## 🗄️ Step 2: Configure Environment Variables

### Backend (.env)

The `.env` file is already created with your Supabase credentials:

**Location**: `backend/.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Database Connection
DATABASE_URL=postgresql://postgres:evq2QET@qke!rdw8cth@db.hycvmhmhisbefxdgmycv.supabase.co:5432/postgres
DB_HOST=db.hycvmhmhisbefxdgmycv.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=evq2QET@qke!rdw8cth

# JWT
JWT_SECRET=checkdee_mvp_secret_key_change_in_production_v1_2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
LIFF_URL=http://localhost:5174
```

### Frontend (.env)

**Location**: `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🗄️ Step 3: Set Up Database

Run these commands from the `backend` directory:

```bash
cd backend

# Run migrations (creates all 14 tables)
npm run db:migrate

# Seed test data (creates test users)
npm run db:seed
```

**Expected Output:**
```
🔄 Starting database migration...
✅ Database migration completed successfully

🔄 Seeding database...
✅ Admin user created
✅ Manager user created
✅ Field worker created
✅ Database seeding completed
```

---

## 🚀 Step 4: Start the Application

Open **3 separate terminal windows**:

### Terminal 1: Backend Server
```bash
cd backend
npm run dev
```
**Should see:** `✅ Database connected successfully` and `Server running on port 3000`

### Terminal 2: Frontend Web App
```bash
cd frontend
npm run dev
```
**Should see:** `Local: http://localhost:5173/`

### Terminal 3: LIFF Mobile App (Optional)
```bash
cd liff-app
npm run dev
```
**Should see:** `Local: http://localhost:5174/`

---

## 🧪 Step 5: Test the Application

### Test Login

1. **Open browser**: http://localhost:5173/
2. **Login with test credentials**:

   **Admin:**
   - Email: `admin@checkdee.com`
   - Password: `admin123`

   **Manager:**
   - Email: `manager@checkdee.com`
   - Password: `manager123`

   **Field Worker:**
   - Email: `worker@checkdee.com`
   - Password: `worker123`

3. **You should see**: Dashboard with task statistics and map

### Test API Health

Open: http://localhost:3000/health

**Should return:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T..."
}
```

---

## 📊 Verify Supabase Database

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**: `checkdee`
3. **Go to**: Table Editor (left sidebar)
4. **You should see 14 tables**:
   - users
   - teams
   - tasks
   - task_templates
   - task_checklists
   - task_questions
   - task_submissions
   - submission_photos
   - submission_checklist_items
   - submission_answers
   - task_reviews
   - activity_logs
   - notifications
   - refresh_tokens

5. **Click on `users` table** - You should see 3 test users

---

## 🎯 What's Working (MVP Features)

### ✅ Backend API (Fully Functional)
- User authentication (login/logout)
- JWT tokens with refresh
- User management (CRUD)
- Team management
- Task creation & assignment
- Task submissions with GPS check-in
- Photo upload endpoints
- Review & approval workflow
- Activity logging
- Role-based access control

### ✅ Frontend Web App (Fully Functional)
- Login page
- Dashboard with stats & map
- Tasks list & details
- Create/edit tasks
- User management
- Team management
- Submissions review
- Approve/reject submissions

### ⚠️ LIFF Mobile App (Partially Complete)
- Basic structure ready
- Needs GPS check-in implementation
- Needs photo capture
- Needs checklist UI

---

## 🔧 Troubleshooting

### Database Connection Error
**Error:** `getaddrinfo EAI_AGAIN`
**Fix:** Check your internet connection and Supabase credentials

### Port Already in Use
**Error:** `EADDRINUSE: address already in use`
**Fix:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in backend/.env
PORT=3001
```

### Migration Failed
**Error:** `relation already exists`
**Fix:** Tables already exist! Skip migration or reset:
```bash
# In Supabase Dashboard > SQL Editor, run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then run migrations again
npm run db:migrate
```

---

## 🌐 Next Steps for Production

### 1. Configure AWS S3 for Photo Storage
- Create AWS S3 bucket
- Add credentials to `backend/.env`:
  ```env
  AWS_ACCESS_KEY_ID=your_key
  AWS_SECRET_ACCESS_KEY=your_secret
  AWS_S3_BUCKET=checkdee-photos
  AWS_REGION=ap-southeast-1
  ```

### 2. Set Up LINE Integration
- Create LINE Developers account
- Create Messaging API channel
- Create LIFF app
- Add credentials to `backend/.env`

### 3. Get Google Maps API Key
- Go to Google Cloud Console
- Enable Maps JavaScript API
- Create API key
- Add to `backend/.env`

### 4. Deploy to Production

**Recommended Stack:**
- **Database**: Supabase (already set up!)
- **Backend**: Railway, Render, or AWS
- **Frontend**: Vercel or Netlify
- **LIFF App**: Vercel or Netlify

---

## 📞 Support

If you run into issues:
1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Check network connectivity

---

## 🎉 Success Checklist

- [ ] Backend server running on port 3000
- [ ] Frontend accessible at http://localhost:5173
- [ ] Can login with test credentials
- [ ] Dashboard shows stats and map
- [ ] Can create new tasks
- [ ] Supabase tables populated
- [ ] API health check returns 200

---

**Your Supabase database is ready and waiting!** Just run the migrations on your local machine and you're good to go! 🚀
