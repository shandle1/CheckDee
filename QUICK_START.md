# CheckDee - Quick Start Guide

## 🚀 Application is Running!

**Backend**: http://localhost:3000
**Frontend**: http://localhost:5173

---

## 📋 Test Accounts

### Admin Account
- **Email**: `admin@checkdee.com`
- **Password**: `admin123`
- **Access**: Full system access

### Manager Accounts
- **Bangkok**: `somchai@checkdee.com` / `manager123`
- **Chiang Mai**: `niran@checkdee.com` / `manager123`
- **Phuket**: `suda@checkdee.com` / `manager123`

### Field Worker Accounts
- **Wichai**: `wichai@checkdee.com` / `worker123`
- **Malee**: `malee@checkdee.com` / `worker123`
- **Preecha**: `preecha@checkdee.com` / `worker123`
- **Siriporn**: `siriporn@checkdee.com` / `worker123`
- **Kanya**: `kanya@checkdee.com` / `worker123`
- **Boonmee**: `boonmee@checkdee.com` / `worker123`

---

## 📊 What's in the Database

### Teams (3)
1. **Bangkok Central Team** - Somchai Manager
2. **Chiang Mai Team** - Niran Manager
3. **Phuket Team** - Suda Manager

### Users (10 total)
- 1 Admin
- 3 Managers
- 6 Field Workers

### Tasks (5 with real locations)
1. **Store Inspection - Central World** (Bangkok)
   - Assigned to: Wichai
   - Priority: High
   - Status: Assigned

2. **Product Delivery - Siam Paragon** (Bangkok)
   - Assigned to: Malee
   - Priority: Urgent
   - Status: In Progress

3. **Customer Survey - MBK Center** (Bangkok)
   - Assigned to: Preecha
   - Priority: Normal
   - Status: Assigned

4. **Equipment Check - Chiang Mai Airport**
   - Assigned to: Siriporn
   - Priority: High
   - Status: Assigned

5. **Beach Resort Inspection - Patong Beach** (Phuket)
   - Assigned to: Boonmee
   - Priority: High
   - Status: Assigned

Each task has:
- Real GPS coordinates
- Checklist items
- Due dates
- Priority levels

---

## 🎯 Quick Test Flow

### 1. Login as Admin
```
1. Go to http://localhost:5173
2. Login with: admin@checkdee.com / admin123
3. You should see the Dashboard
```

### 2. View Users
```
1. Click "Users" in the sidebar
2. You should see all 10 users
3. Try searching or filtering by role
```

### 3. View Teams
```
1. Click "Teams" in the sidebar
2. You should see 3 teams with member counts
3. Click on a team to see members
```

### 4. View Tasks
```
1. Click "Tasks" in the sidebar
2. You should see 5 tasks with:
   - Titles and locations
   - Assigned workers
   - Status and priority badges
   - Due dates
```

### 5. Create a New Task (as Admin/Manager)
```
1. Click "Tasks" → "Create Task" button
2. Fill in the form:
   - Title
   - Description
   - Location (try: "Terminal 21, Bangkok")
   - Assign to a worker
   - Set due date and priority
3. Add checklist items
4. Submit
```

---

## 🔍 What You Can Do

### As Admin
✅ View dashboard with statistics
✅ Manage all users (create, edit, delete)
✅ Manage all teams
✅ Create and assign tasks
✅ View all submissions
✅ Approve/reject submissions

### As Manager
✅ View dashboard
✅ Manage users in their teams
✅ Create and assign tasks
✅ View submissions from their team
✅ Approve/reject submissions

### As Field Worker
✅ View assigned tasks
✅ See task details and checklists
✅ (LIFF app would allow check-in, photos, submission)

---

## 🗺️ Real Locations in Database

All tasks use actual Bangkok, Chiang Mai, and Phuket coordinates:

- **Central World**: 13.7469°N, 100.5398°E
- **Siam Paragon**: 13.7465°N, 100.5347°E
- **MBK Center**: 13.7443°N, 100.5302°E
- **Chiang Mai Airport**: 18.7714°N, 98.9626°E
- **Patong Beach**: 7.8964°N, 98.2964°E

---

## 🛠️ Troubleshooting

### Pages Not Loading?
- Check browser console (F12) for errors
- Ensure both backend and frontend are running
- Try clearing browser cache and reload

### Can't Login?
```bash
# Check if backend is running
curl http://localhost:3000/health

# Test login API directly
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@checkdee.com","password":"admin123"}'
```

### Backend Not Running?
```bash
cd /Users/steve/Documents/Cursor/Test/checkdee/backend
npm run dev
```

### Frontend Not Running?
```bash
cd /Users/steve/Documents/Cursor/Test/checkdee/frontend
npm run dev
```

### Need to Reset Database?
```bash
cd /Users/steve/Documents/Cursor/Test/checkdee/backend
npm run db:migrate
node src/database/seed-full.js
```

---

## 📱 Next Steps

1. **Test the web interface** with different user roles
2. **Create new tasks** and assign them to workers
3. **Explore the map view** on the dashboard (if implemented)
4. **Complete the LIFF app** for mobile check-ins

---

## 🎉 You Have a Working Application!

- ✅ Full backend API with 20+ endpoints
- ✅ PostgreSQL database with realistic Thai data
- ✅ React frontend with authentication
- ✅ User, team, and task management
- ✅ Role-based access control
- ✅ Real GPS coordinates for Thai locations

**Enjoy exploring CheckDee!** 🇹🇭
