// Firebase Configuration
// Get these from: Firebase Console > Project Settings > General > Your apps

import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  clearIndexedDbPersistence,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)

// Initialize Firestore with persistent local cache for offline support.
// persistentMultipleTabManager allows multiple browser tabs to share the cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Clear persistence on development when app reloads (hot reload)
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Clear persistence to avoid stale cache issues in dev
  clearIndexedDbPersistence(db).catch((err) => {
    // This is expected to fail on first run, ignore
    // console.log("Persistence clear error:", err)
  })
}

export default app
