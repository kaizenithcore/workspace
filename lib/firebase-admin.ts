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

// Track if admin is actually usable (has valid credentials)
let adminAvailable = false
let adminAvailabilityChecked = false

// Initialize Firebase Admin SDK
// When running on Firebase Hosting (deployed), this will use the default service account
// When running locally, set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON
if (!admin.apps.length) {
  try {
    // Try to initialize with service account from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      })
      adminAvailable = true
      adminAvailabilityChecked = true
      console.log("[Firebase Admin] Initialized with service account from env")
    } else {
      // Fall back to Application Default Credentials (works via firebase login, gcloud auth, or default service account on Cloud Run/Hosting)
      try {
        admin.initializeApp({
          projectId,
        })
        adminAvailable = true
        adminAvailabilityChecked = true
        console.log("[Firebase Admin] Initialized with Application Default Credentials")
      } catch (credError) {
        // In development without credentials, initialize with a dummy credential for dev purposes
        // This prevents the app from crashing but API calls will fail gracefully
        if (process.env.NODE_ENV === "development") {
          console.warn("[Firebase Admin] No credentials available. To simulate production, add FIREBASE_SERVICE_ACCOUNT to .env.local")
          adminAvailable = false
          adminAvailabilityChecked = true
          // Initialize without credentials for dev to prevent crashes
          admin.initializeApp({
            projectId: projectId || "demo-project",
          })
        } else {
          throw credError
        }
      }
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
    adminAvailable = false
    adminAvailabilityChecked = true
    if (process.env.NODE_ENV === "production") {
      throw new Error("Failed to initialize Firebase Admin SDK")
    } else {
      // In development, warn but don't throw so the app can start
      console.warn("[Firebase Admin] Initialization failed in development. Some features will be limited.")
    }
  }
}

export const adminDb = admin.firestore()

/**
 * Check if Firebase Admin is available with valid credentials
 * Returns immediately without trying to access Firestore
 */
export function isAdminAvailable(): boolean {
  return adminAvailable
}

export interface AdminSubscriptionUpdate {
  plan?: "free" | "individual" | "pro"
  planType?: "free" | "monthly" | "yearly"
  status?: "active" | "inactive" | "past_due" | "canceled"
  subscriptionStatus?:
    | "none"
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused"
    | "canceled_at_period_end"
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  subscriptionExpiresAt?: Date
  subscriptionStartAt?: Date
  currentPeriodEnd?: Date
}

/**
 * Get user document from Firestore using Admin SDK
 * Bypasses security rules - only use in protected API routes
 */
export async function getAdminUserDocument(userId: string) {
  // Fast-fail if admin credentials are not available
  if (!adminAvailable) {
    throw new Error("Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.")
  }

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

export async function updateAdminUserSubscription(
  userId: string,
  updates: AdminSubscriptionUpdate
) {
  // Fast-fail if admin credentials are not available
  if (!adminAvailable) {
    throw new Error("Firebase Admin not available")
  }

  const docRef = adminDb.collection("users").doc(userId)
  const updateData: Record<string, unknown> = {}

  const assign = (key: keyof AdminSubscriptionUpdate, path: string) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const value = updates[key]
      updateData[path] = value === undefined ? admin.firestore.FieldValue.delete() : value
    }
  }

  assign("plan", "subscription.plan")
  assign("planType", "subscription.planType")
  assign("status", "subscription.status")
  assign("subscriptionStatus", "subscription.subscriptionStatus")
  assign("stripeCustomerId", "subscription.stripeCustomerId")
  assign("stripeSubscriptionId", "subscription.stripeSubscriptionId")
  assign("stripePriceId", "subscription.stripePriceId")
  assign("subscriptionExpiresAt", "subscription.subscriptionExpiresAt")
  assign("subscriptionStartAt", "subscription.subscriptionStartAt")
  assign("currentPeriodEnd", "subscription.currentPeriodEnd")

  if (Object.keys(updateData).length === 0) {
    return
  }

  await docRef.set(updateData, { merge: true })
}

export async function getAdminUserByStripeCustomerId(stripeCustomerId: string) {
  // Fast-fail if admin credentials are not available
  if (!adminAvailable) {
    throw new Error("Firebase Admin not available")
  }

  const snapshot = await adminDb
    .collection("users")
    .where("subscription.stripeCustomerId", "==", stripeCustomerId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const docSnap = snapshot.docs[0]
  return {
    uid: docSnap.id,
    user: docSnap.data(),
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
