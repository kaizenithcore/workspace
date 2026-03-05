# Firebase Admin Refactoring - Quick Start

## TL;DR for Developers

✅ **Your code doesn't need to change**

The refactoring is **100% backward compatible**. All existing API routes work exactly as before.

## What Changed?

- ❌ **Old:** `FIREBASE_SERVICE_ACCOUNT` (JSON string env var)
- ✅ **New:** Three separate env vars (safer, no JSON parsing)

```env
# Instead of parsing a big JSON string...
FIREBASE_PROJECT_ID=my-project
FIREBASE_CLIENT_EMAIL=...@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

## What Improved?

- ✅ Fixes Docker/Coolify JSON parsing errors
- ✅ Faster builds (no Firebase init during build)
- ✅ Single Admin instance guaranteed
- ✅ Better error messages
- ✅ Lower resource usage

## For Developers (No Action Needed)

Your code continues to work **without any changes**:

```typescript
// Your existing code - works exactly the same:
import { getAdminUserDocument, updateAdminUserSubscription } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  const user = await getAdminUserDocument(userId)  // ✅ Still works
  await updateAdminUserSubscription(userId, { plan: "pro" })  // ✅ Still works
  return NextResponse.json({ success: true })
}
```

## For DevOps / Deployment

### Step 1: Get Credentials
Go to Google Cloud Console → Service Accounts → Your Firebase service account → Keys → Download JSON

### Step 2: Extract Three Values
From the JSON file:
```
project_id → FIREBASE_PROJECT_ID
client_email → FIREBASE_CLIENT_EMAIL
private_key → FIREBASE_PRIVATE_KEY
```

### Step 3: Set in Coolify
Settings → Variables:
```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_CLIENT_EMAIL = ...@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEv....\n-----END PRIVATE KEY-----\n
```

Mark both EMAIL and KEY as **Secret** (toggle on right side).

### Step 4: Redeploy
That's it! Your app will now:
- ✅ Build faster
- ✅ Deploy without JSON errors
- ✅ Handle Firebase safely

## Verification

After deployment, check logs:
```
[Firebase Admin] Initialized with service account credentials
```

If you see that message, everything is working!

## If Something Goes Wrong

### "Initialization error"
Check that FIREBASE_PROJECT_ID, EMAIL, and KEY are all set in Coolify.

### "Permission denied"  
Make sure the service account has **Cloud Datastore User** role in Google Cloud IAM.

### "Invalid private key"
Make sure FIREBASE_PRIVATE_KEY is the complete key from the JSON file, with `\n` (escaped newlines, not literal).

## Documentation

- **Full setup guide:** [FIREBASE_ENVIRONMENT_SETUP.md](FIREBASE_ENVIRONMENT_SETUP.md)
- **How it works:** [FIREBASE_ADMIN_REFACTOR.md](FIREBASE_ADMIN_REFACTOR.md)
- **Visual comparison:** [FIREBASE_ARCHITECTURE_BEFORE_AFTER.md](FIREBASE_ARCHITECTURE_BEFORE_AFTER.md)
- **Compatibility check:** [FIREBASE_ADMIN_COMPATIBILITY.md](FIREBASE_ADMIN_COMPATIBILITY.md)

## Timeline

- **Before:** 1 week debugging JSON parsing errors
- **After:** Deploy in 30 minutes with env var setup

---

**That's it!** You're ready to deploy. 🚀
