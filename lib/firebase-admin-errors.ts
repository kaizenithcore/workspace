/**
 * Helper functions for consistent Firebase Admin error handling across API endpoints
 * 
 * Usage:
 * try {
 *   const user = await getAdminUserDocument(userId)
 * } catch (error) {
 *   return handleFirebaseAdminError(error, "Task validation")
 * }
 */

import { NextResponse } from "next/server"

export interface ErrorResponse {
  valid?: boolean
  error?: string
  errors?: string[]
  message?: string
}

/**
 * Check if an error is related to Firebase Admin credentials/initialization
 */
export function isFirebaseCredentialError(error: unknown): boolean {
  const errorStr = error instanceof Error ? error.message : String(error)
  return (
    errorStr.includes("Private key") ||
    errorStr.includes("PEM") ||
    errorStr.includes("credential") ||
    errorStr.includes("Failed to parse") ||
    errorStr.includes("FIREBASE_PRIVATE_KEY") ||
    errorStr.includes("Failed to initialize Firebase Admin") ||
    errorStr.includes("Could not load") ||
    errorStr.includes("GOOGLE_APPLICATION_CREDENTIALS")
  )
}

/**
 * Log Firebase credential errors with helpful debugging info
 */
export function logFirebaseCredentialError(error: unknown, context: string): void {
  console.error(`[Firebase Admin] Credential error in ${context}:`, error)
  console.error("")
  console.error("[Firebase Admin] ⚠️  CREDENTIAL CONFIGURATION ERROR")
  console.error("[Firebase Admin] This is likely due to FIREBASE_PRIVATE_KEY misconfiguration")
  console.error("")
  console.error("[Firebase Admin] Troubleshooting steps:")
  console.error("[Firebase Admin] 1. Check that FIREBASE_PRIVATE_KEY is set in environment variables")
  console.error("[Firebase Admin] 2. The key should contain literal \\n (backslash-n), not actual newlines")
  console.error("[Firebase Admin] 3. Alternative: Use actual multiline newlines in Coolify if supported")
  console.error("[Firebase Admin] 4. Run 'npm run validate-firebase-credentials' to diagnose")
  console.error("")
  console.error("[Firebase Admin] Error details:", error instanceof Error ? error.message : String(error))
}

/**
 * Handle Firebase Admin errors with appropriate responses for API endpoints
 * 
 * @param error The error object
 * @param context Description of what operation failed (e.g., "Task validation")
 * @param statusCode Optional HTTP status code (defaults to 500)
 * @returns NextResponse with appropriate error message and status
 */
export function handleFirebaseAdminError(
  error: unknown,
  context: string,
  statusCode = 500
): NextResponse {
  const isCredentialError = isFirebaseCredentialError(error)

  if (isCredentialError) {
    logFirebaseCredentialError(error, context)

    return NextResponse.json(
      {
        valid: false,
        errors: [
          "Server authentication configuration error. " +
          "Please contact support if this persists.",
        ],
      },
      { status: statusCode }
    )
  }

  // For other errors, return generic message
  const errorMsg = error instanceof Error ? error.message : String(error)
  console.error(`[API] ${context} error:`, errorMsg)

  return NextResponse.json(
    {
      valid: false,
      errors: [
        statusCode === 404 ? `${context}: User not found` : "Internal server error",
      ],
    },
    { status: statusCode }
  )
}

/**
 * Safely execute Firebase Admin operations with error handling
 * 
 * @param operation Async function that performs the Firebase operation
 * @param context Description of what operation is being performed
 * @param fallbackValue Value to return in development if operation fails due to credentials
 * @returns The result of the operation or fallback value
 */
export async function executeFirebaseOperation<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const isCredentialError = isFirebaseCredentialError(error)

    if (isCredentialError) {
      logFirebaseCredentialError(error, context)

      // In development, return fallback value if provided
      if (process.env.NODE_ENV === "development" && fallbackValue !== undefined) {
        console.warn(
          `[API] Firebase not configured in development for ${context}. Using fallback.`
        )
        return fallbackValue
      }
    }

    throw error
  }
}
