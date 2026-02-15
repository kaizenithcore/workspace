/**
 * Data Migration Script – dev only
 *
 * Reassigns all documents from a placeholder ownerId (e.g. "1") to a real
 * Firebase Auth UID. Run once per user after they first sign in.
 *
 * Usage (from browser console or a one-off admin page):
 *   import { migrateUserData } from "@/scripts/migrate-users"
 *   await migrateUserData("1", "REAL_FIREBASE_UID")
 *
 * Prerequisites:
 *   - The calling user must be signed in with the target UID.
 *   - Firestore rules must temporarily allow the migration
 *     (or run with the Firebase Admin SDK from a trusted server).
 *
 * Steps for secure migration:
 *   1. Back up your Firestore data (export via Firebase console).
 *   2. Temporarily relax Firestore rules for the old ownerId
 *      OR run this script server-side with Admin SDK.
 *   3. Call migrateUserData(oldOwnerId, newUid) for each user.
 *   4. Re-deploy production Firestore rules.
 *   5. Verify data appears correctly in the app.
 */

import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"

const COLLECTIONS = [
  "categories",
  "projects",
  "tasks",
  "events",
  "time_entries",
  "pomodoro_sessions",
  "notifications",
]

/**
 * Migrate all documents from oldOwnerId to newOwnerId across every collection.
 * Uses Firestore batched writes for atomicity (max 500 ops per batch).
 */
export async function migrateUserData(
  oldOwnerId: string,
  newOwnerId: string,
): Promise<{ collection: string; migrated: number }[]> {
  const results: { collection: string; migrated: number }[] = []

  for (const col of COLLECTIONS) {
    const q = query(collection(db, col), where("ownerId", "==", oldOwnerId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      results.push({ collection: col, migrated: 0 })
      continue
    }

    // Firestore batched writes allow max 500 operations per batch
    let batch = writeBatch(db)
    let batchCount = 0
    let totalMigrated = 0

    for (const docSnap of snapshot.docs) {
      batch.update(doc(db, col, docSnap.id), {
        ownerId: newOwnerId,
        userId: newOwnerId,
      })
      batchCount++
      totalMigrated++

      if (batchCount >= 499) {
        await batch.commit()
        batch = writeBatch(db)
        batchCount = 0
      }
    }

    if (batchCount > 0) {
      await batch.commit()
    }

    results.push({ collection: col, migrated: totalMigrated })
  }

  console.log("[Migration] Complete:", results)
  return results
}

/**
 * Seed initial data for a new user in Firestore.
 * Creates default categories, one default project, and a welcome notification.
 */
export async function seedNewUser(uid: string) {
  const batch = writeBatch(db)

  // Default categories
  const defaultCats = [
    { name: "Work", color: "#3B82F6" },
    { name: "Personal", color: "#10B981" },
    { name: "Learning", color: "#F59E0B" },
  ]

  const catRefs: string[] = []
  for (const cat of defaultCats) {
    const ref = doc(collection(db, "categories"))
    catRefs.push(ref.id)
    batch.set(ref, {
      ...cat,
      ownerId: uid,
      userId: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Default project
  const projRef = doc(collection(db, "projects"))
  batch.set(projRef, {
    name: "My Project",
    color: "#3B82F6",
    categoryIds: [catRefs[0]],
    isDefault: true,
    ownerId: uid,
    userId: uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Welcome notification
  const notifRef = doc(collection(db, "notifications"))
  batch.set(notifRef, {
    type: "system",
    title: "Welcome to FocusTracker!",
    message: "Start by creating your first task or starting a Pomodoro session.",
    read: false,
    ownerId: uid,
    userId: uid,
    createdAt: new Date(),
  })

  await batch.commit()
  console.log("[Seed] New user data created for", uid)
}
