# Testing LINE Worker Authentication - Step-by-Step Guide

## ✅ Configuration Complete!

Your LINE authentication system is now fully configured and ready to test!

**Servers Running:**
- ✅ Backend: http://localhost:3000 (with LINE credentials)
- ✅ Frontend: http://localhost:5173 (with new Users page)
- ✅ LIFF App: Ready to deploy (with LIFF ID: 2008332604-VXp47qv7)

---

## 🧪 Test 1: Create a Field Worker Account

### Step 1: Login to Web App
1. Open browser: http://localhost:5173
2. Login with admin credentials:
   - Email: `admin@checkdee.com`
   - Password: `admin123`

### Step 2: Navigate to Users Page
1. Click on "Users" in the navigation menu
2. You should see the users list with new columns:
   - Phone
   - LINE Status

### Step 3: Create a Test Worker
1. Click "Create User" button
2. Fill in the form:
   - **Name**: `Test Worker`
   - **Email**: `testworker@checkdee.com`
   - **Phone**: `0812345678` ⚠️ **Important: This will be used for linking!**
   - **Role**: Select `Field Worker`
   - **Password**: `password123`
3. Click "Create User"
4. The new worker should appear in the table
5. Notice:
   - Phone column shows: 0812345678
   - LINE Status shows: "Not Linked" (gray badge)
   - Actions column has a green link icon (🔗)

---

## 🧪 Test 2: Generate Invitation Link

### Step 1: Generate Invite
1. In the users table, find "Test Worker"
2. Click the green link icon (🔗) in the Actions column
3. **Invitation Modal** should appear showing:
   - "Generating invitation..." (briefly)
   - Then displays:
     - Large QR code image
     - Invitation URL (long link)
     - Copy button
     - Expiry time (24 hours from now)

### Step 2: Copy the Invitation Link
1. Click the "Copy" button
2. You should see "Copied!" confirmation
3. The URL format will be:
   ```
   http://localhost:5174/link?token=eyJhbGciOiJIUzI1...
   ```

**Save this link!** You'll need it for the next test.

---

## 🧪 Test 3: Link Worker Account via Invitation Link

### Prerequisites
- You need a mobile device with LINE app installed
- You need to be logged into LINE on that device
- You need the LIFF app URL accessible from your phone

### Step 1: Deploy LIFF App (Development)

**Option A: Using ngrok (Recommended for testing)**
```bash
# In a new terminal
cd /Users/steve/Documents/GitHub/CheckDee/liff-app
npm install -g ngrok  # If not already installed
ngrok http 5174
```

**Important**: Copy the HTTPS URL that ngrok provides (e.g., `https://abc123.ngrok.io`)

**Update LIFF App Settings:**
1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your LINE Login channel
3. Go to LIFF tab
4. Click on your LIFF app (2008332604-VXp47qv7)
5. Click "Edit"
6. Update "Endpoint URL" to your ngrok URL: `https://abc123.ngrok.io`
7. Click "Update"

**Start LIFF App:**
```bash
cd /Users/steve/Documents/GitHub/CheckDee/liff-app
npm run dev
```

**Option B: Deploy to Vercel/Netlify (For persistent testing)**
```bash
# Deploy LIFF app to Vercel
cd /Users/steve/Documents/GitHub/CheckDee/liff-app
vercel --prod

# Update LIFF endpoint URL to your Vercel URL
```

### Step 2: Test via Invitation Link
1. Open LINE app on your phone
2. Send yourself the invitation link in any LINE chat
3. Click the link
4. LIFF app should open within LINE
5. You should see:
   - LINE login screen (automatic)
   - "Linking Account..." loading screen
   - Success message: "Account Linked Successfully!"
   - Automatic redirect to tasks page

### Step 3: Verify Linking
1. Go back to the web app (http://localhost:5173)
2. Go to Users page
3. Find "Test Worker"
4. LINE Status should now show:
   - "Linked" (green badge with LINE icon)
   - Your LINE display name
   - When linked date

---

## 🧪 Test 4: Link Worker Account via Phone Number

### Setup
1. Create another test worker:
   - Name: `Phone Test Worker`
   - Email: `phonetest@checkdee.com`
   - Phone: `0898765432`
   - Role: Field Worker
   - Password: `password123`

### Test Phone Linking
1. On your phone, open LINE
2. Access your LIFF app directly (not via invitation link)
   - Use your ngrok URL or deployed URL
3. You should see:
   - "Welcome, [Your LINE Name]!"
   - "Link your LINE account to start using CheckDee"
   - Phone number input field
4. Enter the phone number: `0898765432`
5. Click "Link Account"
6. You should see:
   - "Linking Account..." loading screen
   - Success message
   - Redirect to tasks page

### Verify
1. Go back to web app
2. Check Users page
3. "Phone Test Worker" should now show as "Linked"

---

## 🧪 Test 5: Subsequent Login (Auto-Login)

### Test Auto-Login
1. Close the LIFF app completely
2. Reopen the LIFF app from LINE
3. You should:
   - See brief "Loading..." screen
   - Automatically be logged in
   - Go directly to tasks page
   - **No linking needed!**

This proves that LINE authentication is working correctly!

---

## 🔍 Troubleshooting

### Issue: "LIFF app won't open"
**Check:**
- LIFF endpoint URL is correct in LINE Developers Console
- ngrok is running (if using ngrok)
- LIFF app dev server is running on port 5174

### Issue: "Token does not belong to this LINE Login channel"
**Check:**
- `LINE_LOGIN_CHANNEL_ID` in `backend/.env` matches your LINE Login channel
- Not using Messaging API channel ID by mistake

### Issue: "No worker account found with this phone number"
**Check:**
- Phone number entered exactly matches the one in the database
- Worker account exists and role is `field_worker`
- Phone number doesn't have extra spaces

### Issue: "Failed to send LINE message"
**Check:**
- `LINE_CHANNEL_ACCESS_TOKEN` is correct
- Token is from Messaging API channel (not LINE Login)
- Token hasn't expired

### Issue: "Network Error" when generating invite
**Check:**
- Backend server is running (http://localhost:3000)
- Frontend can reach backend API
- Check browser console for errors

---

## 📊 Database Verification

Check if linking worked in the database:

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/checkdee

# Check users with LINE accounts
SELECT id, name, email, phone, role, line_id, line_display_name, linked_at
FROM users
WHERE role = 'field_worker';

# Check invitation tokens
SELECT u.name, uit.token, uit.expires_at, uit.used_at
FROM user_invite_tokens uit
JOIN users u ON uit.user_id = u.id
ORDER BY uit.created_at DESC;

# Check activity logs
SELECT u.name, al.action, al.details, al.timestamp
FROM activity_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action IN ('line_account_linked', 'line_login', 'invite_generated')
ORDER BY al.timestamp DESC
LIMIT 10;
```

---

## ✅ Success Criteria

Your LINE authentication is working correctly if:

- ✅ You can create field workers with phone numbers
- ✅ You can generate invitation links with QR codes
- ✅ Workers can link accounts via invitation link
- ✅ Workers can link accounts via phone number
- ✅ LINE profile info appears in the users table
- ✅ Workers auto-login on subsequent LIFF app opens
- ✅ Database shows `line_id` and `linked_at` for linked workers
- ✅ Activity logs show linking events

---

## 🎯 Next Steps

Once LINE authentication is working:

1. **Test task assignment to linked workers**
2. **Test LINE notifications** (worker receives messages)
3. **Test full worker workflow** (receive task → check in → submit)
4. **Deploy LIFF app to production** (Vercel/Netlify)
5. **Update LIFF endpoint URL to production URL**

---

## 📱 Quick Test Checklist

- [ ] Created test worker with phone number
- [ ] Generated invitation link successfully
- [ ] QR code displays in modal
- [ ] Can copy invitation link
- [ ] LIFF app opens via invitation link
- [ ] Account links successfully via token
- [ ] LINE status shows "Linked" in web app
- [ ] Created second worker for phone test
- [ ] Account links successfully via phone number
- [ ] Auto-login works on subsequent LIFF app opens
- [ ] Database shows correct LINE data

---

**Ready to test?** Start with Test 1 and work your way through! 🚀
