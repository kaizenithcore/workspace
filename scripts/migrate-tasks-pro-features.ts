/**
 * Migration script: Add Pro features fields to existing tasks
 * 
 * This script adds the new fields needed for Pro task features to all existing tasks:
 * - subtasks: []
 * - dependencies: []
 * - blocked: false
 * - subtaskCount: 0
 * - completedSubtasks: 0
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 3. Run: npx ts-node scripts/migrate-tasks-pro-features.ts
 */

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"

// Initialize Firebase Admin
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide your service account key here
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
})

const db = getFirestore(app)

interface MigrationStats {
  totalTasks: number
  migratedTasks: number
  skippedTasks: number
  errors: number
}

async function migrateTasksProFeatures() {
  console.log("🚀 Starting migration: Add Pro features to tasks...")
  
  const stats: MigrationStats = {
    totalTasks: 0,
    migratedTasks: 0,
    skippedTasks: 0,
    errors: 0,
  }

  try {
    // Get all tasks
    const tasksRef = db.collection("tasks")
    const tasksSnapshot = await tasksRef.get()

    stats.totalTasks = tasksSnapshot.size
    console.log(`📊 Found ${stats.totalTasks} tasks to process`)

    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500
    let batch = db.batch()
    let batchCount = 0

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data()

      // Check if task already has the new fields
      const hasNewFields =
        "subtasks" in taskData &&
        "dependencies" in taskData &&
        "blocked" in taskData &&
        "subtaskCount" in taskData &&
        "completedSubtasks" in taskData

      if (hasNewFields) {
        stats.skippedTasks++
        continue
      }

      // Add new fields with defaults
      try {
        batch.update(taskDoc.ref, {
          subtasks: taskData.subtasks || [],
          dependencies: taskData.dependencies || [],
          blocked: taskData.blocked || false,
          subtaskCount: taskData.subtaskCount || 0,
          completedSubtasks: taskData.completedSubtasks || 0,
          updatedAt: FieldValue.serverTimestamp(),
        })

        stats.migratedTasks++
        batchCount++

        // Commit batch when reaching size limit
        if (batchCount >= batchSize) {
          await batch.commit()
          console.log(`✅ Committed batch of ${batchCount} tasks`)
          batch = db.batch()
          batchCount = 0
        }
      } catch (error) {
        console.error(`❌ Error migrating task ${taskDoc.id}:`, error)
        stats.errors++
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit()
      console.log(`✅ Committed final batch of ${batchCount} tasks`)
    }

    console.log("\n🎉 Migration completed!")
    console.log("📊 Statistics:")
    console.log(`  Total tasks: ${stats.totalTasks}`)
    console.log(`  Migrated: ${stats.migratedTasks}`)
    console.log(`  Skipped (already migrated): ${stats.skippedTasks}`)
    console.log(`  Errors: ${stats.errors}`)

    return stats
  } catch (error) {
    console.error("💥 Migration failed:", error)
    throw error
  }
}

// Run migration
if (require.main === module) {
  migrateTasksProFeatures()
    .then(() => {
      console.log("\n✨ Migration script finished successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n💥 Migration script failed:", error)
      process.exit(1)
    })
}

export { migrateTasksProFeatures }
