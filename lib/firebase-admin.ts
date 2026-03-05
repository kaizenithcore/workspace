/**
 * Firebase Admin SDK lazy initialization for server-side operations
 * Used in API routes and Cloud Functions to bypass Firestore security rules
 *
 * Uses lazy initialization to avoid build-time execution with Next.js App Router
 * Environment variables:
 * - FIREBASE_PROJECT_ID (required)
 * - FIREBASE_CLIENT_EMAIL (required when using service account credentials)
 * - FIREBASE_PRIVATE_KEY (required when using service account credentials, supports \n escaping)
 */

import * as admin from "firebase-admin"

// Environment variables - read at module load time but not used until needed
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY

// Track initialization state
let adminAppInstance: admin.app.App | null = null
let initializationAttempted = false
let initializationError: Error | null = null

/**
 * Parse the private key from environment variable, handling multiple formats:
 * - Escaped newlines: \n (literal backslash-n in single line string)
 * - Double escaped: \\n (may happen in Docker/Coolify environment variables)
 * - Real newlines: actual line breaks in multiline strings
 * 
 * Docker/Coolify may pass keys in different formats, so we handle all cases
 */
function parsePrivateKey(key: string): string {
  if (!key) {
    throw new Error("Private key is empty")
  }

  let parsed = key

  // Handle double-escaped newlines first (\\n -> \n -> actual newline)
  // This can happen in Docker/Coolify environment variable processing
  if (parsed.includes("\\\\n")) {
    console.log("[Firebase Admin] Detected double-escaped newlines (\\\\n), converting...")
    parsed = parsed.replace(/\\\\n/g, "\n")
  } 
  // Then handle single-escaped newlines (\n -> actual newline)
  else if (parsed.includes("\\n")) {
    console.log("[Firebase Admin] Detected single-escaped newlines (\\n), converting...")
    parsed = parsed.replace(/\\n/g, "\n")
  }
  
  // Normalize: ensure we have actual newlines in the key
  const hasNewlines = parsed.includes("\n")
  const hasBeginHeader = parsed.includes("-----BEGIN PRIVATE KEY-----")
  const hasEndFooter = parsed.includes("-----END PRIVATE KEY-----")

  // Check basic structure
  if (!hasBeginHeader) {
    throw new Error(
      "Invalid private key format: missing or malformed PEM header. " +
      "Key must contain '-----BEGIN PRIVATE KEY-----' on a separate line. " +
      `Current start: ${parsed.substring(0, 100)}`
    )
  }
  
  if (!hasEndFooter) {
    throw new Error(
      "Invalid private key format: missing or malformed PEM footer. " +
      "Key must contain '-----END PRIVATE KEY-----' on a separate line. " +
      `Current end: ${parsed.substring(Math.max(0, parsed.length - 100))}`
    )
  }

  // If we have header and footer but no newlines in between, something is wrong
  if (!hasNewlines && hasBeginHeader && hasEndFooter) {
    throw new Error(
      "Private key appears to be on a single line without newline characters. " +
      `The key contains ${parsed.length} characters but no actual newlines. ` +
      "This usually means the escape sequences weren't properly converted. " +
      "Check that FIREBASE_PRIVATE_KEY contains literal \\n characters that will be converted to newlines."
    )
  }

  return parsed
}

/**
 * Validate that required credentials are available
 */
function validateCredentials(): { valid: boolean; error?: string } {
  if (!projectId) {
    return {
      valid: false,
      error: "Missing FIREBASE_PROJECT_ID environment variable",
    }
  }

  if (!clientEmail || !privateKey) {
    // Return a non-error state if credentials are not available - ADC might work
    // This is only an error if we actually try to use admin features
    return { valid: false }
  }

  return { valid: true }
}

/**
 * Initialize Firebase Admin SDK with lazy loading
 * Only called when an admin operation is actually needed
 * Returns the same instance on subsequent calls
 */
function getAdminApp(): admin.app.App {
  // Return existing instance if already initialized
  if (adminAppInstance) {
    return adminAppInstance
  }

  // Prevent re-attempts if initialization already failed
  if (initializationAttempted && initializationError) {
    throw initializationError
  }

  // Mark that we're attempting initialization
  if (!initializationAttempted) {
    initializationAttempted = true
  }

  try {
    // Check if any admin apps already exist (defensive check)
    if (admin.apps.length > 0) {
      adminAppInstance = admin.apps[0]!
      return adminAppInstance
    }

    const credValidation = validateCredentials()

    // If we have explicit service account credentials, use them
    if (credValidation.valid && clientEmail && privateKey) {
      let parsedPrivateKey: string
      
      try {
        parsedPrivateKey = parsePrivateKey(privateKey)
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
        console.error("[Firebase Admin] Private key parsing failed:", errorMsg)
        console.error("[Firebase Admin] Private key length:", privateKey.length)
        console.error("[Firebase Admin] First 50 chars:", privateKey.substring(0, 50))
        throw new Error(`Failed to parse FIREBASE_PRIVATE_KEY: ${errorMsg}`)
      }

      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey: parsedPrivateKey,
      }

      try {
        adminAppInstance = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        })

        console.log("[Firebase Admin] Initialized with service account credentials")
        return adminAppInstance
      } catch (initError) {
        const errorMsg = initError instanceof Error ? initError.message : String(initError)
        console.error("[Firebase Admin] Failed to initialize with service account:", errorMsg)
        throw new Error(`Failed to initialize Firebase Admin: ${errorMsg}`)
      }
    }

    // Fall back to Application Default Credentials (ADC)
    // This works with:
    // - GOOGLE_APPLICATION_CREDENTIALS environment variable
    // - Cloud Run / Cloud Functions environment
    // - Firebase Hosting environment
    // - gcloud auth on local machine
    adminAppInstance = admin.initializeApp({
      projectId,
    })

    console.log("[Firebase Admin] Initialized with Application Default Credentials (ADC)")
    return adminAppInstance
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    console.error("[Firebase Admin] Initialization error:", err.message)

    initializationError = err

    // In production, throw immediately to fail fast
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[Firebase Admin] Failed to initialize Firebase Admin SDK: ${err.message}`
      )
    }

    // In development, throw as well to alert developers
    throw new Error(
      `[Firebase Admin] Failed to initialize Firebase Admin SDK: ${err.message}`
    )
  }
}

/**
 * Get Firestore database instance
 * Lazily initializes Firebase Admin on first call
 */
export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}


/**
 * Check if Firebase Admin can be initialized
 * This performs a lightweight check without actually accessing Firestore
 */
export function isAdminAvailable(): boolean {
  try {
    // If already initialized successfully, we're good
    if (adminAppInstance) {
      return true
    }

    // If initialization was attempted and failed, return false
    if (initializationAttempted && initializationError) {
      return false
    }

    // Check if we have credentials available
    const credValidation = validateCredentials()

    // If we have explicit credentials or might have ADC, we can attempt initialization
    if (credValidation.valid || projectId) {
      return true
    }

    return false
  } catch {
    return false
  }
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
 * Lazily initializes Firebase Admin on first call
 */
export async function getAdminUserDocument(userId: string) {
  try {
    const db = getAdminDb()
    const docSnap = await db.collection("users").doc(userId).get()

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
  const db = getAdminDb()
  const docRef = db.collection("users").doc(userId)
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
  const db = getAdminDb()

  const snapshot = await db
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
