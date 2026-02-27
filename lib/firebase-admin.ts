/**
 * Firebase Admin SDK initialization for server-side operations
 * Used in API routes and Cloud Functions to bypass Firestore security rules
 */

import * as admin from "firebase-admin"

// Get projectId from environment (same variable used in client config)
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

if (!projectId) {
  console.error(
    "[Firebase Admin] Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable"
  )
}

// Initialize Firebase Admin SDK
// When running on Firebase Hosting (deployed), this will use the default service account
// When running locally, ensure you've authenticated with 'firebase login' or set GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  try {
    // Try to initialize with service account from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      })
      console.log("[Firebase Admin] Initialized with service account from env")
    } else {
      // Fall back to Application Default Credentials (works via firebase login, gcloud auth, or default service account on Cloud Run/Hosting)
      admin.initializeApp({
        projectId,
      })
      console.log("[Firebase Admin] Initialized with Application Default Credentials")
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
    throw new Error("Failed to initialize Firebase Admin SDK")
  }
}

export const adminDb = admin.firestore()

/**
 * Get user document from Firestore using Admin SDK
 * Bypasses security rules - only use in protected API routes
 */
export async function getAdminUserDocument(userId: string) {
  try {
    const docSnap = await adminDb.collection("users").doc(userId).get()

    if (!docSnap.exists) {
      return null
    }

    return docSnap.data()
  } catch (error) {
    console.error("[Firebase Admin] Error fetching user document:", error)
    throw error
  }
}

/**
 * Type for user document returned from Admin SDK
 */
export interface AdminUserDocument {
  email?: string
  name?: string | null
  createdAt?: any
  profile?: {
    avatarUrl?: string
    backgroundUrl?: string
    bio?: string
  }
  subscription?: {
    plan: "free" | "individual" | "trial"
    status?: "active" | "inactive"
    currentPeriodEnd?: any
    trialEndsAt?: any
  }
  preferences?: {
    language?: "en" | "es" | "ja"
    theme?: "light" | "dark" | "system"
    cardTransparency?: boolean
    backgroundImageUrl?: string
  }
}
