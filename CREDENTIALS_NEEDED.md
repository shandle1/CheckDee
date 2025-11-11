# LINE Credentials Needed for CheckDee

## Summary

CheckDee requires **TWO separate LINE channels** for full functionality:

### 1. LINE Login Channel (for LIFF Authentication)
- Used for worker authentication in the mobile app
- Verifies LIFF access tokens

### 2. Messaging API Channel (for Notifications)
- Used to send push notifications to workers
- Sends account linking confirmations
- Sends task reminders

---

## What I Need From You

Please provide these **5 credentials**:

### From LINE Login Channel:
1. **LINE Login Channel ID** (10-digit number)
   - Example: `1234567890`

2. **LIFF ID** (format: ####-########)
   - Example: `1234-abcd5678`

### From Messaging API Channel:
3. **Messaging API Channel ID** (10-digit number)
   - Example: `9876543210`

4. **Channel Secret** (32-character hex string)
   - Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

5. **Channel Access Token** (long string)
   - Example: `abc123def456ghi789...` (very long)

---

## Where to Find These

### If You Already Have LINE Channels Set Up:

**LINE Login Channel:**
- Go to [LINE Developers Console](https://developers.line.biz/console/)
- Select your provider
- Click on your **LINE Login** channel
- **Channel ID**: Basic Settings tab
- **LIFF ID**: LIFF tab > Your LIFF app

**Messaging API Channel:**
- Same console
- Click on your **Messaging API** channel
- **Channel ID**: Basic Settings tab
- **Channel Secret**: Basic Settings tab
- **Access Token**: Messaging API tab > "Channel access token (long-lived)" > Issue

### If You Need to Create Them:

Please see [LINE_CHANNEL_SETUP.md](LINE_CHANNEL_SETUP.md) for complete step-by-step instructions on:
- Creating LINE Login channel
- Creating LIFF app
- Creating Messaging API channel
- Issuing access token
- Recommended settings

---

## Format for Providing Credentials

Please provide them in this format:

```
LINE Login Channel ID: 1234567890
LIFF ID: 1234-abcd5678
Messaging Channel ID: 9876543210
Messaging Channel Secret: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
Channel Access Token: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz...
```

---

## What Happens Next

Once you provide these credentials, I will:

1. ✅ Update `backend/.env` with all 5 credentials
2. ✅ Update `liff-app/.env` with LIFF ID
3. ✅ Activate the new code files (replace old versions)
4. ✅ Restart both servers (backend & frontend)
5. ✅ Test the LINE authentication flow
6. ✅ Guide you through creating your first worker and testing the full onboarding process

---

## Security Note

These credentials are sensitive! Only share them:
- Via secure/encrypted channels
- Never commit to Git
- Store securely (password manager)

The `.env` files are already in `.gitignore` to prevent accidental commits.

---

**Ready when you are!** Just provide the 5 credentials above and we'll get LINE authentication up and running! 🚀
