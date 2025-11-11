# LINE Worker Authentication - Implementation Status

## ✅ Backend Implementation (COMPLETE)

### Database Changes
- ✅ Added `line_display_name`, `line_picture_url`, `linked_at` to users table
- ✅ Created `user_invite_tokens` table for invitation management
- ✅ Added indexes for performance

### New Backend Files Created
1. ✅ `backend/src/utils/line.js` - LINE API integration
   - verifyLiffToken() - Verify LIFF tokens
   - getLINEProfile() - Get LINE user profile
   - sendLINEMessage() - Send LINE notifications

2. ✅ `backend/src/utils/linkToken.js` - Invitation token management
   - generateLinkToken() - Create secure tokens
   - verifyLinkToken() - Verify tokens
   - generateInvitationUrl() - Build invite URLs

3. ✅ `backend/src/utils/qrCode.js` - QR code generation
   - generateQRCode() - Base64 QR images
   - generateLinkingQRCode() - Invitation QR codes

4. ✅ `backend/src/routes/line.routes.js` - LINE authentication endpoints
   - POST /api/line/auth - LINE login (returns JWT if linked)
   - POST /api/line/link-phone - Link via phone number
   - POST /api/line/link-token - Link via invitation token
   - GET /api/line/link-status/:lineUserId - Check link status

5. ✅ `backend/src/middleware/auth.js` - Updated with LIFF support
   - authenticateLIFF() - LIFF token authentication

### Updated Backend Files
- ✅ `backend/src/server.js` - Registered LINE routes
- ✅ `backend/src/routes/users.routes.js` - Added invite endpoints
  - POST /api/users/:id/generate-invite - Generate invitation link + QR
  - GET /api/users/:id/line-info - Get LINE linking status

### Dependencies Added
- ✅ qrcode - QR code generation

---

## 🔄 Frontend Implementation (IN PROGRESS)

### Files to Update

1. **frontend/src/pages/UsersPage.tsx** - Add LINE features
   - [ ] Add "Phone" field to create user form (required for workers)
   - [ ] Add "LINE Status" column to user table
   - [ ] Add "Generate Invite" button for unlinked workers
   - [ ] Create invitation modal showing link + QR code
   - [ ] Show LINE profile info (displayName, picture) when linked

2. **frontend/src/components/LINEStatusBadge.tsx** - NEW
   - [ ] Green badge for linked accounts
   - [ ] Gray badge for unlinked accounts
   - [ ] Show LINE display name and picture

3. **frontend/src/components/InvitationModal.tsx** - NEW
   - [ ] Display invitation URL with copy button
   - [ ] Display QR code image
   - [ ] Show expiry time (24 hours)
   - [ ] Regenerate link option

---

## 🔄 LIFF App Implementation (PENDING)

### Files to Create

1. **liff-app/src/pages/LinkAccountPage.tsx** - NEW
   - [ ] Phone number input screen
   - [ ] Call POST /api/line/link-phone
   - [ ] Handle success → redirect to tasks
   - [ ] Handle errors → show message

2. **liff-app/src/services/linkService.ts** - NEW
   - [ ] linkViaPhone(lineUserId, phone, liffToken)
   - [ ] linkViaToken(lineUserId, token, liffToken)
   - [ ] checkLinkStatus(lineUserId, liffToken)

### Files to Update

3. **liff-app/src/App.tsx**
   - [ ] After LIFF login, call /api/line/auth
   - [ ] If not linked → redirect to LinkAccountPage
   - [ ] If linked → proceed to tasks

4. **liff-app/src/store/authStore.ts**
   - [ ] Add `isLinked` boolean state
   - [ ] Add `setLinked()` function

---

## 📋 API Endpoints Summary

### LINE Authentication
```
POST /api/line/auth
Body: { liffToken }
Response: { linked, user?, accessToken?, refreshToken? }

POST /api/line/link-phone
Body: { liffToken, phone }
Response: { success, user, accessToken, refreshToken }

POST /api/line/link-token
Body: { liffToken, linkToken }
Response: { success, user, accessToken, refreshToken }

GET /api/line/link-status/:lineUserId
Response: { linked, user? }
```

### User Management
```
POST /api/users/:id/generate-invite
Response: { invitationUrl, qrCode, expiresAt, worker }

GET /api/users/:id/line-info
Response: { linked, lineId, displayName, pictureUrl, linkedAt }
```

---

## 🔑 Environment Variables Required

Add to `backend/.env`:
```
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_LIFF_ID=your_liff_id
```

Add to `liff-app/.env`:
```
VITE_LIFF_ID=your_liff_id
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Testing Workflow

### Admin Creates Worker
1. Login to web app as admin
2. Go to Users page
3. Create new field worker with phone number
4. Click "Generate Invite" on worker row
5. Modal shows invitation URL and QR code
6. Copy link or show QR to worker

### Worker Links Account (Phone)
1. Worker opens LIFF app directly
2. LINE login → gets LINE profile
3. App checks link status → Not linked
4. Shows phone input screen
5. Worker enters phone number
6. App calls /api/line/link-phone
7. Success → receives JWT → redirected to tasks

### Worker Links Account (Invitation Link)
1. Worker receives invitation link from manager
2. Clicks link → opens LIFF app
3. LINE login → gets LINE profile
4. App extracts token from URL
5. App calls /api/line/link-token
6. Success → receives JWT → redirected to tasks

### Subsequent Logins
1. Worker opens LIFF app
2. LINE login → gets LINE userId
3. App calls /api/line/auth with LIFF token
4. Backend verifies LIFF token, matches LINE ID
5. Returns JWT tokens → auto-logged in

---

## ✨ Features Implemented

✅ LIFF token verification with LINE API
✅ Phone number matching for account linking
✅ Invitation token generation (24hr expiry)
✅ QR code generation for invitations
✅ One-time use tokens
✅ LINE profile retrieval and storage
✅ Activity logging for all linking events
✅ LINE notification on successful linking
✅ Prevent duplicate LINE ID linking
✅ Phone number uniqueness validation

---

## 🔒 Security Features

✅ LIFF tokens verified with LINE API (prevents forgery)
✅ Phone numbers must match exactly
✅ Invitation tokens expire in 24 hours
✅ One-time use tokens (marked as used)
✅ LINE ID can only link to one account
✅ Only active field workers can be linked
✅ Audit logging for all linking activities
✅ Role-based access control (admin/manager only for invites)

---

## 📝 Next Steps

1. Update frontend Users page with LINE features
2. Create LIFF app account linking page
3. Update LIFF app auth flow
4. Add LINE credentials to .env
5. Test end-to-end linking flow
6. Test authentication flow
