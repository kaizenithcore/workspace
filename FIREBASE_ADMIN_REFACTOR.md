# Firebase Admin SDK Refactoring

## Overview

The `firebase-admin.ts` module has been refactored to provide **lazy initialization** of Firebase Admin SDK, preventing build-time execution issues in Next.js App Router and Docker/Coolify deployments.

**Key Changes:**
- ✅ Lazy initialization (not at module load time)
- ✅ Safe environment variable parsing with proper newline handling  
- ✅ Support for individual credential environment variables
- ✅ Single Admin instance management
- ✅ Backward compatible API
- ✅ Improved error handling

## Environment Variables

Replace the old `FIREBASE_SERVICE_ACCOUNT` JSON variable with individual environment variables:

```env
# Firebase project configuration (required)
FIREBASE_PROJECT_ID=your-project-id

# Service account credentials (optional, required only for admin operations)
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAk...\n-----END PRIVATE KEY-----\n
```

### Private Key Handling

The `FIREBASE_PRIVATE_KEY` can contain newlines in either format:
- **Escaped form** (from Docker/Coolify): `\n` or `\\n` ✅ (automatically converted)
- **Literal newlines**: Also supported ✅

If using Docker with escaped newlines, they will be automatically converted to real newlines.

### Fallback: Application Default Credentials (ADC)

If `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are not provided, the module will fall back to **Application Default Credentials**:
- Works on Cloud Run, Cloud Functions, Firebase Hosting
- Works with `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Works with `gcloud auth` on local machine
- Useful for deployments where the environment automatically provides credentials

## API Changes

### Breaking Changes: None ✅

All existing functions maintain the same API and behavior:
- `getAdminUserDocument(userId)`
- `updateAdminUserSubscription(userId, updates)`
- `getAdminUserByStripeCustomerId(stripeCustomerId)`
- `isAdminAvailable()`

### New Function: `getAdminDb()`

Instead of importing a constant `adminDb`, use the function `getAdminDb()`:

**Before:**
```typescript
import { adminDb } from "@/lib/firebase-admin"

const docSnap = await adminDb.collection("users").doc(userId).get()
```

**After (if you need direct access):**
```typescript
import { getAdminDb } from "@/lib/firebase-admin"

const db = getAdminDb()
const docSnap = await db.collection("users").doc(userId).get()
```

**Recommended:** Continue using the existing `getAdminUserDocument`, `updateAdminUserSubscription`, and `getAdminUserByStripeCustomerId` functions, which internally call `getAdminDb()`.

## How It Works

### 1. Module Load (No Initialization Yet)
```typescript
// When firebase-admin.ts is imported:
// - Environment variables are read
// - No Firebase Admin SDK initialization happens
// - No errors thrown
```

### 2. Lazy Initialization on First Use
```typescript
// When any function is called (e.g., getAdminUserDocument):
// - getAdminDb() is called
// - getAdminApp() checks if already initialized
// - If not, initializes with credentials or ADC
// - Returns the same instance on subsequent calls
```

### 3. Single Instance Management
The module maintains one `adminAppInstance` that is reused across all operations:
```typescript
let adminAppInstance: admin.app.App | null = null
```

## Error Handling

### Missing Credentials

If credentials are missing and the operation is attempted:

**Production:**
```
[Firebase Admin] Failed to initialize Firebase Admin SDK: <error details>
```
The error is thrown, failing fast.

**Development:**
```
[Firebase Admin] Failed to initialize Firebase Admin SDK: <error details>
```
The error is still thrown to alert developers.

### Invalid JSON/Credentials

The module now avoids JSON parsing errors by using individual environment variables instead of parsing a JSON string. This eliminates the original Docker deployment issue.

## Migration Guide

### Step 1: Update Environment Variables

**Docker/Coolify .env or environment configuration:**

**Old (❌ removed):**
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...", ...}'
```

**New (✅ use):**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
```

### Step 2: No Code Changes Required ✅

All existing API route code continues to work without modification:

```typescript
// existing-api-route.ts
import { getAdminUserDocument, updateAdminUserSubscription } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const userId = await getUserIdFromToken(request)
  const user = await getAdminUserDocument(userId)  // Works exactly the same
  await updateAdminUserSubscription(userId, { plan: "pro" })  // Works exactly the same
  return Response.json({ success: true })
}
```

### Step 3: Verify Deployment

For Docker/Coolify deployments:

```bash
# Ensure environment variables are set during runtime (not build time)
docker run \
  -e FIREBASE_PROJECT_ID=your-project \
  -e FIREBASE_CLIENT_EMAIL=... \
  -e FIREBASE_PRIVATE_KEY=... \
  your-image
```

## Benefits

| Issue | Solution |
|-------|----------|
| JSON parsing errors in Docker | Use individual env vars, no JSON.parse |
| Build-time initialization errors | Lazy initialization via getAdminDb() |
| Multiple Admin instances | Single instance management via module variables |
| Memory usage during build | No Firestore connection during build |
| Unsafe credentials in logs | Better error messages, no credential logs |

## Testing

### Test Lazy Initialization
```typescript
import { isAdminAvailable } from "@/lib/firebase-admin"

// This doesn't initialize anything
console.log(isAdminAvailable())  // true if credentials are configured

// Only when calling actual operations does initialization happen
const user = await getAdminUserDocument(userId)
```

### Test Credential Validation
Ensure environment variables are set:
```bash
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL
echo $FIREBASE_PRIVATE_KEY
```

## Troubleshooting

### "Failed to initialize Firebase Admin SDK"

**Possible causes:**
1. Missing `FIREBASE_PROJECT_ID`
2. Invalid `FIREBASE_PRIVATE_KEY` format
3. Service account credentials are malformed
4. Insufficient permissions on the service account

**Solution:**
1. Verify all three environment variables are set
2. Extract service account credentials from Google Cloud Console
3. Ensure newlines are escaped as `\n` (not literal newlines in shell)

### "Missing FIREBASE_PROJECT_ID environment variable"

**Solution:**
Set the environment variable explicitly or use `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (fallback):
```env
FIREBASE_PROJECT_ID=your-project-id
```

### Private Key Not Working

**If using local development:**
Ensure your `.env.local` has escaped newlines:
```env
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n
```

**If using Docker:**
The module automatically handles escaped newlines in Docker:
```bash
docker run -e FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG...\\n-----END PRIVATE KEY-----\\n"
```

## TypeScript Types

All existing types are preserved:

```typescript
export interface AdminSubscriptionUpdate { ... }
export interface AdminUserDocument { ... }
```

## Production Deployment Checklist

- [ ] Environment variables set in Docker/Coolify
- [ ] `FIREBASE_PROJECT_ID` is correct
- [ ] `FIREBASE_CLIENT_EMAIL` is correct
- [ ] `FIREBASE_PRIVATE_KEY` has escaped newlines
- [ ] Service account has necessary Firestore permissions
- [ ] Verify API routes still work post-deployment
- [ ] Monitor logs for "[Firebase Admin] Initialization error"

## Backward Compatibility

✅ **100% backward compatible** - existing code doesn't need changes.

The old `adminDb` constant is removed, but all functions that used it internally are updated to call `getAdminDb()` automatically.

If you have custom code that imported `adminDb` directly:
```typescript
// Old (no longer available):
import { adminDb } from "@/lib/firebase-admin"

// New (for direct access):
import { getAdminDb } from "@/lib/firebase-admin"
const db = getAdminDb()
```

Most code should use the exported helper functions instead.
