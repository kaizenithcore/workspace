/**
 * Firestore helpers for user documents (users/{uid})
 * 
 * User document schema:
 * {
 *   email: string
 *   name: string | null
 *   createdAt: timestamp
 *   profile: {
 *     avatarUrl?: string
 *     backgroundUrl?: string
 *     bio?: string
 *   }
 *   subscription: {
 *     plan: "free" | "individual"
 *     status: "active" | "inactive"
 *   }
 *   preferences: {
 *     language: "en" | "es"
 *     theme: "light" | "dark" | "system"
 *     cardTransparency: boolean
 *     backgroundImageUrl?: string
 *   }
 * }
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface UserProfile {
  avatarUrl?: string
  backgroundUrl?: string
  bio?: string
}

export interface UserSubscription {
  plan: "free" | "individual"
  status: "active" | "inactive"
}

export interface UserPreferences {
  language: "en" | "es"
  theme: "light" | "dark" | "system"
  cardTransparency: boolean
  backgroundImageUrl?: string | null
}

export interface UserDocument {
  email: string
  name: string | null
  createdAt: Date
  profile: UserProfile
  subscription: UserSubscription
  preferences: UserPreferences
  proInterestSubmitted?: boolean
  proInterestSubmittedAt?: Date
}

/** Convert Firestore Timestamp to Date */
function convertTimestamp(data: Record<string, unknown>): UserDocument {
  const result = { ...data }
  if (result.createdAt && typeof result.createdAt === "object" && "toDate" in result.createdAt) {
    result.createdAt = (result.createdAt as Timestamp).toDate()
  }
  return result as unknown as UserDocument
}

/** Get user document from Firestore */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  const docRef = doc(db, "users", uid)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  return convertTimestamp(docSnap.data() as Record<string, unknown>)
}

/** Create a new user document with defaults */
export async function createUserDocument(
  uid: string,
  email: string,
  name?: string
): Promise<void> {
  const userDoc: Omit<UserDocument, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    email,
    name: name || null,
    createdAt: serverTimestamp(),
    profile: {},
    subscription: {
      plan: "free",
      status: "active",
    },
    preferences: {
      language: "en",
      theme: "system",
      cardTransparency: false,
    },
  }
  
  await setDoc(doc(db, "users", uid), userDoc)
}

/** Update user profile fields (avatarUrl, backgroundUrl, bio) */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const docRef = doc(db, "users", uid)
  
  // Build update object with profile.* paths, removing undefined
  const updateData: Record<string, unknown> = {}
  if (updates.avatarUrl !== undefined) updateData["profile.avatarUrl"] = updates.avatarUrl
  if (updates.backgroundUrl !== undefined) updateData["profile.backgroundUrl"] = updates.backgroundUrl
  if (updates.bio !== undefined) updateData["profile.bio"] = updates.bio
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(docRef, updateData)
  }
}

/** Update user name and/or email */
export async function updateUserInfo(
  uid: string,
  updates: { name?: string | null; email?: string }
): Promise<void> {
  const docRef = doc(db, "users", uid)
  const updateData: Record<string, unknown> = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.email !== undefined) updateData.email = updates.email
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(docRef, updateData)
  }
}

/** Update user preferences (language, theme, cardTransparency, backgroundImageUrl) */
export async function updateUserPreferences(
  uid: string,
  updates: Partial<UserPreferences>
): Promise<void> {
  const docRef = doc(db, "users", uid)
  
  const updateData: Record<string, unknown> = {}
  if (updates.language !== undefined) updateData["preferences.language"] = updates.language
  if (updates.theme !== undefined) updateData["preferences.theme"] = updates.theme
  if (updates.cardTransparency !== undefined) updateData["preferences.cardTransparency"] = updates.cardTransparency
  if (updates.backgroundImageUrl !== undefined) updateData["preferences.backgroundImageUrl"] = updates.backgroundImageUrl
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(docRef, updateData)
  }
}

/** Mark user as having submitted pro interest */
export async function markProInterestSubmitted(uid: string): Promise<void> {
  const docRef = doc(db, "users", uid)
  await updateDoc(docRef, {
    proInterestSubmitted: true,
    proInterestSubmittedAt: serverTimestamp(),
  })
}

/** Ensure user document exists, creating with defaults if needed */
export async function ensureUserDocument(
  uid: string,
  email: string,
  name?: string
): Promise<UserDocument> {
  let userDoc = await getUserDocument(uid)
  
  if (!userDoc) {
    await createUserDocument(uid, email, name)
    userDoc = await getUserDocument(uid)
  }
  
  return userDoc!
}
