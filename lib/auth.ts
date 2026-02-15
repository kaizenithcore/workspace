import { auth } from "@/lib/firebase/config"
import { signOut as firebaseSignOut } from "firebase/auth"

/**
 * Sign out the current user
 * Clears Firebase auth state and redirects to login
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
    // Client-side redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth"
    }
  } catch (error) {
    console.error("[Auth] Error signing out:", error)
    throw error
  }
}

/**
 * Check if user is authenticated
 * Returns true if there's an active Firebase auth session
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}

/**
 * Get current user ID
 * Returns the Firebase user ID or null if not authenticated
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null
}
