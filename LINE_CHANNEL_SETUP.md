# LINE Channel Setup Guide for CheckDee

## Overview

CheckDee requires **TWO separate LINE channels** to function properly:

1. **LINE Login Channel** - For LIFF app authentication
2. **Messaging API Channel** - For sending notifications to workers

This separation is required by LINE's architecture and provides better security and organization.

---

## Channel 1: LINE Login Channel (for LIFF App)

### Purpose
- Authenticate workers via LIFF app
- Get user profile information (LINE user ID, display name, picture)
- Verify LIFF access tokens

### What You Need From This Channel

**From LINE Developers Console:**

1. **LINE Login Channel ID** (`LINE_LOGIN_CHANNEL_ID`)
   - Location: Console > Your Provider > LINE Login Channel > Basic Settings
   - Format: 10-digit number (e.g., `1234567890`)
   - Used for: Verifying LIFF tokens belong to your app

2. **LIFF ID** (`LINE_LIFF_ID`)
   - Location: Console > Your Provider > LINE Login Channel > LIFF > Your LIFF App
   - Format: `####-########` (e.g., `1234-abcd5678`)
   - Used for: Initializing LIFF SDK in mobile app

### Setup Steps

1. **Create LINE Login Channel**
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Select your provider (or create one)
   - Click "Create a new channel"
   - Select "LINE Login"
   - Fill in:
     - Channel name: `CheckDee Worker Login`
     - Channel description: `Authentication for CheckDee field workers`
     - App types: Check "Web app"

2. **Create LIFF App**
   - Go to your LINE Login channel
   - Click "LIFF" tab
   - Click "Add"
   - Fill in:
     - LIFF app name: `CheckDee Mobile`
     - Size: `Full`
     - Endpoint URL: Your LIFF app URL (e.g., `https://your-domain.com` or `http://localhost:5174` for dev)
     - Scopes: Check `profile` and `openid`
     - Bot link feature: `Off` (not needed)
   - Click "Add"
   - Copy the **LIFF ID** that's generated

3. **Get Channel ID**
   - Go to "Basic settings" tab
   - Copy the **Channel ID** (10-digit number)

---

## Channel 2: Messaging API Channel (for Notifications)

### Purpose
- Send push messages to workers
- Notify workers about task assignments
- Send account linking confirmations
- Send task completion reminders

### What You Need From This Channel

**From LINE Developers Console:**

1. **Messaging API Channel ID** (`LINE_MESSAGING_CHANNEL_ID`)
   - Location: Console > Your Provider > Messaging API Channel > Basic Settings
   - Format: 10-digit number (e.g., `9876543210`)
   - Used for: Reference (mainly for debugging)

2. **Channel Secret** (`LINE_MESSAGING_CHANNEL_SECRET`)
   - Location: Console > Your Provider > Messaging API Channel > Basic Settings
   - Format: 32-character hex string
   - Used for: Verifying webhook signatures (if you add webhooks later)

3. **Channel Access Token (Long-lived)** (`LINE_CHANNEL_ACCESS_TOKEN`)
   - Location: Console > Your Provider > Messaging API Channel > Messaging API
   - Format: Long string starting with `+` or letters
   - Used for: Sending push messages to users

### Setup Steps

1. **Create Messaging API Channel**
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Select your provider (same one as LINE Login)
   - Click "Create a new channel"
   - Select "Messaging API"
   - Fill in:
     - Channel name: `CheckDee Notifications`
     - Channel description: `Send notifications to CheckDee workers`
     - Category: Choose appropriate category (e.g., "Productivity")
     - Subcategory: Choose appropriate subcategory

2. **Get Channel Secret**
   - Go to "Basic settings" tab
   - Copy the **Channel secret**

3. **Issue Channel Access Token**
   - Go to "Messaging API" tab
   - Scroll to "Channel access token (long-lived)"
   - Click "Issue"
   - Copy the token **immediately** (it won't be shown again)

4. **Configure Channel Settings** (Optional but Recommended)
   - Go to "Messaging API" tab
   - Set these options:
     - **Allow bot to join group chats**: `Disabled`
     - **Auto-reply messages**: `Disabled` (we'll send messages programmatically)
     - **Greeting messages**: `Disabled`
     - **Webhooks**: `Disabled` (unless you want to receive messages from users)

---

## Environment Variables Configuration

Once you have all the credentials, you'll need to provide:

### For Backend (`backend/.env`)

```env
# LINE Login Channel (for LIFF App Authentication)
LINE_LOGIN_CHANNEL_ID=1234567890
LINE_LIFF_ID=1234-abcd5678

# LINE Messaging API Channel (for Notifications)
LINE_MESSAGING_CHANNEL_ID=9876543210
LINE_MESSAGING_CHANNEL_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
LINE_CHANNEL_ACCESS_TOKEN=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### For LIFF App (`liff-app/.env`)

```env
VITE_LIFF_ID=1234-abcd5678
VITE_API_URL=http://localhost:3000/api
```

---

## Checklist

Before providing credentials, make sure you have:

- [ ] Created LINE Login Channel
- [ ] Created LIFF app under LINE Login Channel
- [ ] Noted down LINE Login Channel ID (10 digits)
- [ ] Noted down LIFF ID (format: ####-########)
- [ ] Created Messaging API Channel
- [ ] Noted down Messaging API Channel ID (10 digits)
- [ ] Noted down Messaging API Channel Secret (32 chars)
- [ ] Issued Channel Access Token (long string)
- [ ] Disabled auto-reply and greeting messages in Messaging API settings

---

## Testing Credentials

Once configured, you can test if everything works:

### Test 1: LIFF Token Verification
```bash
# This will be tested when a worker opens the LIFF app
# Backend will verify the token against LINE_LOGIN_CHANNEL_ID
```

### Test 2: Send Notification
```bash
# This will be tested when a worker links their account
# Backend will send a welcome message using LINE_CHANNEL_ACCESS_TOKEN
```

---

## Common Issues

### Issue: "Token does not belong to this LINE Login channel"
**Cause**: `LINE_LOGIN_CHANNEL_ID` doesn't match the channel that issued the LIFF token
**Solution**: Double-check you're using the Channel ID from the LINE Login channel (not Messaging API)

### Issue: "Failed to send LINE message"
**Cause**: Invalid `LINE_CHANNEL_ACCESS_TOKEN` or token from wrong channel
**Solution**: Re-issue the token from Messaging API channel

### Issue: LIFF app won't initialize
**Cause**: Wrong `LINE_LIFF_ID` or LIFF app not properly configured
**Solution**: Check LIFF app settings and ensure endpoint URL is correct

---

## What to Provide

**Please provide these 5 credentials:**

1. **LINE Login Channel ID** (10 digits)
2. **LIFF ID** (####-########)
3. **Messaging API Channel ID** (10 digits)
4. **Messaging API Channel Secret** (32 chars)
5. **Messaging API Channel Access Token** (long string)

Once you provide these, I will:
1. Update `backend/.env` with all credentials
2. Update `liff-app/.env` with LIFF ID
3. Restart servers
4. Test the configuration
5. Guide you through the first worker onboarding

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           LINE Developers Console               │
│                                                 │
│  ┌──────────────────────┐  ┌─────────────────┐│
│  │ LINE Login Channel   │  │ Messaging API   ││
│  │                      │  │ Channel         ││
│  │ • Channel ID         │  │                 ││
│  │ • LIFF App           │  │ • Channel ID    ││
│  │   └─ LIFF ID         │  │ • Channel Secret││
│  │                      │  │ • Access Token  ││
│  └──────────┬───────────┘  └────────┬────────┘│
│             │                       │         │
└─────────────┼───────────────────────┼─────────┘
              │                       │
              │                       │
     ┌────────▼────────┐    ┌────────▼────────┐
     │   LIFF App      │    │  Backend API    │
     │  (Worker Auth)  │    │ (Notifications) │
     │                 │    │                 │
     │ • Init LIFF     │    │ • Send messages │
     │ • Get profile   │    │ • Push notifs   │
     │ • Get token     │    │ • Webhooks      │
     └─────────────────┘    └─────────────────┘
```

---

## Next Steps

1. Create both LINE channels in the console
2. Configure LIFF app under LINE Login channel
3. Issue access token from Messaging API channel
4. Provide all 5 credentials
5. I'll configure the system and guide you through testing

Ready when you are! 🚀
