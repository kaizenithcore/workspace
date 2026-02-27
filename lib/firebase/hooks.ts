"use client"

// Firebase Hooks (Stubbed)
// These hooks provide Firebase authentication and Firestore data access
// Uncomment and configure once Firebase is set up


import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./config"
// import { auth, db } from "./config"
// import { onAuthStateChanged, User } from "firebase/auth"
// import { collection, query, onSnapshot, QueryConstraint, DocumentData } from "firebase/firestore"

// Stubbed User type
interface StubUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

/**
 * Hook to get the current authenticated user
 * Returns null if not authenticated, or the user object if authenticated
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return { user, loading }
}


/**
 * Hook to subscribe to a Firestore collection with real-time updates
 * @param collectionPath - The path to the collection (e.g., "tasks", "users/uid/projects")
 * @param constraints - Optional query constraints (where, orderBy, limit)
 */
export function useCollection<T>(
  collectionPath: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _constraints: unknown[] = [],
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // TODO: Uncomment when Firebase is configured
    // const q = query(collection(db, collectionPath), ...constraints as QueryConstraint[])
    // const unsubscribe = onSnapshot(
    //   q,
    //   (snapshot) => {
    //     const docs = snapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     })) as T[]
    //     setData(docs)
    //     setLoading(false)
    //   },
    //   (err) => {
    //     setError(err)
    //     setLoading(false)
    //   }
    // )
    // return () => unsubscribe()

    // Stub: Return empty data for development
    console.log(`[Firebase Stub] Subscribing to collection: ${collectionPath}`)
    setTimeout(() => {
      setData([])
      setLoading(false)
    }, 300)
  }, [collectionPath])

  return { data, loading, error }
}

/**
 * Hook to sync local data with Firestore on reconnect
 * Used for offline-first features like Pomodoro and Time Tracker
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<unknown[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // TODO: Sync pending data to Firestore
      if (pendingSync.length > 0) {
        console.log("[Firebase Stub] Syncing pending data:", pendingSync)
        setPendingSync([])
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [pendingSync])

  const queueForSync = (data: unknown) => {
    if (!isOnline) {
      setPendingSync((prev) => [...prev, data])
    }
  }

  return { isOnline, queueForSync, pendingSync }
}
