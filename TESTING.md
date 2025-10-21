# CheckDee Application - Testing Guide

## Quick Start

### Backend
- **URL**: http://localhost:3000
- **Status**: http://localhost:3000/health

### Frontend
- **URL**: http://localhost:5173
- **Login Page**: http://localhost:5173/login

---

## Test Accounts

### Admin Account
- **Email**: `admin@checkdee.com`
- **Password**: `admin123`
- **Access**: Full system access (all features)

### Manager Accounts
1. **Bangkok Manager**
   - Email: `somchai@checkdee.com`
   - Password: `password123`

2. **Chiang Mai Manager**
   - Email: `niran@checkdee.com`
   - Password: `password123`

3. **Phuket Manager**
   - Email: `suda@checkdee.com`
   - Password: `password123`

### Field Worker Accounts
1. **Malee** - Email: `malee@checkdee.com` / Password: `password123`
2. **Wichai** - Email: `wichai@checkdee.com` / Password: `password123`
3. **Preecha** - Email: `preecha@checkdee.com` / Password: `password123`
4. **Siriporn** - Email: `siriporn@checkdee.com` / Password: `password123`
5. **Kanya** - Email: `kanya@checkdee.com` / Password: `password123`
6. **Boonmee** - Email: `boonmee@checkdee.com` / Password: `password123`

---

## Test Data

### Teams (3 total)
1. **Bangkok Central Team** - 4 members
2. **Chiang Mai Team** - 3 members
3. **Phuket Team** - 2 members

### Tasks (5 total)
1. **Store Inspection - Central World** (Bangkok) - High Priority, Assigned
2. **Product Delivery - Siam Paragon** (Bangkok) - Urgent Priority, In Progress
3. **Customer Survey - MBK Center** (Bangkok) - Normal Priority
4. **Equipment Check - Chiang Mai Airport** - High Priority
5. **Beach Resort Inspection - Patong** (Phuket) - High Priority

All tasks have:
- Real GPS coordinates in Thailand
- Checklist items (3 items for Bangkok tasks)
- Photo requirements (2 before, 2 after)
- Assigned workers

---

## Testing Checklist

### 1. Authentication (Login Page)
- [ ] Login with admin account
- [ ] Login with manager account
- [ ] Login with worker account
- [ ] Test invalid credentials (should show error)
- [ ] Test empty form submission (should show validation)
- [ ] Logout and re-login

### 2. Dashboard Page
**Access**: All authenticated users

Test Items:
- [ ] Stats cards display correctly (Total, Pending, Completed, Overdue)
- [ ] Recent tasks list shows up to 5 tasks
- [ ] Map displays with task markers
- [ ] Click on map markers shows task popup
- [ ] All task statuses display with correct colors

### 3. Tasks List Page
**Access**: All authenticated users

Test Items:
- [ ] Table displays all tasks
- [ ] Search bar filters tasks by title/description
- [ ] Status filter dropdown works (Pending, In Progress, Completed, Cancelled)
- [ ] Priority filter works (Low, Medium, High, Urgent)
- [ ] Assigned User filter works
- [ ] Click task title navigates to detail page
- [ ] Status badges show correct colors
- [ ] Priority badges show correct colors

### 4. Task Detail Page
**Access**: All authenticated users

Test Items:
- [ ] Task title and description display
- [ ] Location information shows (address, coordinates, geofence radius)
- [ ] Assigned worker info displays
- [ ] Status and priority badges show
- [ ] Due date displays correctly
- [ ] Checklist items display with critical markers
- [ ] Photo requirements section shows counts
- [ ] Delete button visible (admin/manager only)
- [ ] Back button navigates to tasks list

### 5. Create Task Page
**Access**: Admin and Managers only

Test Items:
- [ ] Form loads with all fields
- [ ] Users dropdown populates
- [ ] Required field validation works
- [ ] Location section accepts coordinates
- [ ] Geofence radius slider works (10-1000m)
- [ ] Priority dropdown works
- [ ] Photo requirements checkboxes work
- [ ] Add checklist item button works
- [ ] Add question button works
- [ ] Remove checklist/question buttons work
- [ ] Form submission creates task
- [ ] Redirects to tasks list after creation

###  6. Users Page
**Access**: Admin and Managers only

Test Items:
- [ ] Users table displays all users
- [ ] Search bar filters by name/email
- [ ] Stats show total/admins/managers/workers count
- [ ] Create User button opens modal
- [ ] Create user form validation works
- [ ] Can create new user successfully
- [ ] Edit button opens modal (if implemented)
- [ ] Delete button shows confirmation modal
- [ ] Can delete user successfully
- [ ] User stats update after CRUD operations

### 7. Teams Page
**Access**: Admin and Managers only

Test Items:
- [ ] Teams table displays all teams
- [ ] Search bar filters teams
- [ ] Members count shows for each team
- [ ] Members list displays under team
- [ ] Create Team button opens modal
- [ ] Create team form works
- [ ] Can create new team
- [ ] Delete button shows confirmation
- [ ] Can delete team successfully

### 8. Submissions Page
**Access**: All authenticated users

Test Items:
- [ ] Submissions list displays
- [ ] Search bar filters submissions
- [ ] Status filter works (Pending, Approved, Rejected)
- [ ] Worker filter works
- [ ] Task title links to submission detail
- [ ] Status badges show correct colors
- [ ] Submitted by worker info displays
- [ ] Check-in/out times display

### 9. Submission Detail Page
**Access**: All authenticated users

Test Items:
- [ ] Submission details display
- [ ] Task information shows
- [ ] Worker info displays
- [ ] Check-in location and time show
- [ ] Check-out info shows (if exists)
- [ ] Checklist responses display
- [ ] Question answers display
- [ ] Photos display (if any)
- [ ] Review section visible (managers/admin only)
- [ ] Can approve submission
- [ ] Can reject submission with notes
- [ ] Status updates after review

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task (admin/manager)
- `PUT /api/tasks/:id` - Update task (admin/manager)
- `DELETE /api/tasks/:id` - Delete task (admin)

### Users
- `GET /api/users` - List all users (admin/manager)
- `POST /api/users` - Create user (admin/manager)
- `DELETE /api/users/:id` - Delete user (admin)

### Teams
- `GET /api/teams` - List all teams (admin/manager)
- `GET /api/teams/:id` - Get team details
- `POST /api/teams` - Create team (admin/manager)
- `DELETE /api/teams/:id` - Delete team (admin)

### Submissions
- `GET /api/submissions` - List submissions
- `GET /api/submissions/:id` - Get submission details
- `POST /api/submissions/:id/review` - Review submission (admin/manager)

---

## Known Issues & Limitations

### Current Limitations
1. **Submissions**: No actual submissions exist in test data (pages will show "no submissions found")
2. **Map Interactions**: Map is read-only on dashboard, no editing location via map on create page
3. **Photo Upload**: File upload UI present but not connected to S3/storage backend
4. **Real-time Updates**: Socket.io configured but not fully implemented
5. **LINE LIFF**: Mobile app structure exists but not fully functional

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️  Mobile browsers (responsive but some features may not work perfectly)

---

## Troubleshooting

### Backend Won't Start
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker start checkdee-postgres

# Restart backend
cd checkdee/backend
npm run dev
```

### Frontend Won't Load
```bash
# Clear Vite cache
cd checkdee/frontend
rm -rf node_modules/.vite

# Restart frontend
npm run dev
```

### Database Issues
```bash
# Re-run migrations
cd checkdee/backend
npm run db:migrate

# Re-seed data
npm run db:seed
```

### "Failed to load" Errors
1. Check browser console for specific error
2. Verify backend is running on port 3000
3. Verify frontend is running on port 5173
4. Check that you're logged in
5. Try clearing browser localStorage and re-login

---

## Testing Best Practices

1. **Test with Different Roles**: Login with admin, manager, and worker accounts to see different permissions
2. **Test CRUD Operations**: Create, read, update (where applicable), delete for each entity
3. **Test Validations**: Try submitting forms with invalid/empty data
4. **Test Filters**: Use all filter options on list pages
5. **Test Navigation**: Use browser back/forward and in-app navigation
6. **Check Console**: Keep browser dev tools open to catch errors
7. **Test Edge Cases**: Try maximum values, special characters, etc.

---

## Success Criteria

Application is working correctly if:
- ✅ All pages load without errors
- ✅ Login/logout works
- ✅ Dashboard shows statistics and map
- ✅ CRUD operations work for tasks, users, teams
- ✅ Filters and search work on all list pages
- ✅ Forms validate and submit correctly
- ✅ Navigation between pages works
- ✅ Role-based access control works (workers can't see users/teams pages)
