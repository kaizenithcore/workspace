# Firebase Admin Environment Setup for Docker/Coolify

This guide helps you properly configure Firebase credentials for Docker and Coolify deployments.

## Overview

Instead of storing the entire service account JSON in a single environment variable (which causes parsing errors), we now use **three separate environment variables**:

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

This eliminates JSON parsing errors in containerized environments.

## Step 1: Get Service Account Credentials

### From Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **Service Accounts** (IAM & Admin → Service Accounts)
4. Click on your Firebase service account
5. Go to **Keys** tab
6. Click **Create new key** → **JSON**
7. A JSON file downloads - keep it safe

### Example Service Account Key
```json
{
  "type": "service_account",
  "project_id": "my-project-id",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Step 2: Extract Values

From the service account JSON file, extract these three values:

### `FIREBASE_PROJECT_ID`
```
my-project-id
```
Location in JSON: `project_id`

### `FIREBASE_CLIENT_EMAIL`
```
firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com
```
Location in JSON: `client_email`

### `FIREBASE_PRIVATE_KEY`
This is the trickiest part. Extract from JSON `private_key` field.

**Original format (from Google Cloud Console):**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAkEA0Z3VS5JJcds...
(many more lines)
...
...gB/y9uJd7kMNpPoApxDaDOdcYMSNTRg=
-----END PRIVATE KEY-----
```

**For Docker/Coolify environment variable:**
- Replace literal newlines with `\n`
- Keep it as a single line

```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAkEA0Z3VS5JJcds...\n...\n...gB/y9uJd7kMNpPoApxDaDOdcYMSNTRg=\n-----END PRIVATE KEY-----\n"
```

## Step 3: Configure Environment Variables

### Option A: Docker Compose

Edit your `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    environment:
      FIREBASE_PROJECT_ID: my-project-id
      FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com
      FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAkEA0Z3VS5JJcds...\n...\n-----END PRIVATE KEY-----\n"
```

### Option B: Dockerfile (via ARG)

```dockerfile
FROM node:20

ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY

ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY

# ... rest of Dockerfile
```

Build with:
```bash
docker build \
  --build-arg FIREBASE_PROJECT_ID=my-project-id \
  --build-arg FIREBASE_CLIENT_EMAIL=... \
  --build-arg FIREBASE_PRIVATE_KEY=... \
  -t my-app .
```

### Option C: Coolify

1. Go to **Project Settings** → **Variables**
2. Add three new variables:

| Name | Value | Secret |
|------|-------|--------|
| `FIREBASE_PROJECT_ID` | `my-project-id` | No |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com` | Yes |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Yes (important!) |

3. Redeploy your application

### Option D: .env File (Local Development)

Create `.env.local`:

```env
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAkEA0Z3VS5JJcds...\n...\n-----END PRIVATE KEY-----\n"
```

## Step 4: Verify Configuration

### Check Environment Variables in Docker

```bash
# After deploying to Docker
docker exec <container-id> env | grep FIREBASE
```

Should output:
```
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@my-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

### Test in Node.js Console

In your running container:

```bash
docker exec <container-id> node -e "
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);
console.log('Key valid:', process.env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY'));
"
```

### Check Application Logs

After deployment, check logs for:

```
[Firebase Admin] Initialized with service account credentials
```

If you see errors, check the troubleshooting section below.

## Troubleshooting

### Error: "Expected property name or '}' in JSON"

**Cause:** Newlines in the private key are not properly escaped.

**Solution:**
- Use `\n` (escaped form) not actual newlines
- In Coolify, paste the entire key as one line
- Check that the key starts with `-----BEGIN` and ends with `-----END`

### Error: "Invalid private key format"

**Cause:** The private key is corrupted or incomplete.

**Solution:**
1. Copy the entire private key from Google Cloud Console
2. Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. Escape all newlines as `\n`
4. Verify the key is a single, unbroken line in the env variable

### Error: "Missing FIREBASE_PROJECT_ID"

**Cause:** The environment variable is not set.

**Solution:**
1. Check Coolify environment variables are saved
2. Verify the variable name matches exactly: `FIREBASE_PROJECT_ID`
3. Redeploy the application

### Error: "Permission denied" or "Not authorized"

**Cause:** The service account doesn't have Firestore permissions.

**Solution:**
1. Go to Google Cloud Console → your project
2. Go to **IAM & Admin** → **IAM**
3. Find your service account
4. Click **Edit** and add this role: **Cloud Datastore User**
5. Grant role **Editor** if you need write permissions

### Private Key Keeps Getting Truncated

**Cause:** Some copy-paste tools truncate long values.

**Solution:**
1. Use a text editor to verify the full key is copied
2. In Coolify, use the **Paste** button instead of drag-and-drop
3. Verify the value by checking the first and last 20 characters

## Example: Complete Setup in Coolify

### Step-by-step:

1. **Go to your Coolify project**
2. **Click Settings** → **Variables**
3. **Click Add Variable** and fill:
   - **Key:** `FIREBASE_PROJECT_ID`
   - **Value:** `focustracker-kaizenith` (your actual project ID)
   - **Secret:** No

4. **Click Add Variable** and fill:
   - **Key:** `FIREBASE_CLIENT_EMAIL`
   - **Value:** `firebase-adminsdk-fbsvc@focustracker-kaizenith.iam.gserviceaccount.com`
   - **Secret:** Yes

5. **Click Add Variable** and fill:
   - **Key:** `FIREBASE_PRIVATE_KEY`
   - **Value:** `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAkEAwZ...\n...rg=\n-----END PRIVATE KEY-----\n`
   - **Secret:** Yes

6. **Save** and **Redeploy**

7. **Check logs** - you should see:
   ```
   [Firebase Admin] Initialized with service account credentials
   ```

## Security Best Practices

- ✅ **Mark `FIREBASE_PRIVATE_KEY` as Secret** in Coolify (hidden from logs)
- ✅ **Mark `FIREBASE_CLIENT_EMAIL` as Secret** in Coolify
- ✅ **Don't commit credentials** to Git (use `.env.local`)
- ✅ **Use service account** that only has Firestore permissions
- ✅ **Rotate keys periodically** in Google Cloud Console
- ✅ **Use IAM roles** to limit permissions to minimum needed

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Service Accounts](https://cloud.google.com/docs/authentication/getting-started)
- [Coolify Environment Variables](https://coolify.io/docs/knowledge-base/env)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)

## Next Steps

1. Extract the three environment variable values
2. Configure them in your Docker/Coolify setup
3. Deploy your application
4. Verify by checking logs for initialization message
5. Test your API endpoints to ensure they work

If you get stuck at any point, refer to the Troubleshooting section above.
