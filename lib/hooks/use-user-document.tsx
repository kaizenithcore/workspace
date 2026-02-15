"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { UserDocument } from "@/lib/firestore-user"

/**
 * Reactive hook that subscribes to the user's Firestore document in real-time
 * Returns null while loading or if user doesn't exist
 * Updates automatically when the document changes
 */
export function useUserDocument(uid: string | null | undefined) {
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setUserDoc(null)
      setLoading(false)
      return
    }

    setLoading(true)
    let unsubscribe: Unsubscribe | null = null

    try {
      const docRef = doc(db, "users", uid)
      
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data()
            
            // Convert Firestore Timestamp to Date
            const convertedData = { ...data }
            if (data.createdAt?.toDate) {
              convertedData.createdAt = data.createdAt.toDate()
            }
            
            setUserDoc(convertedData as UserDocument)
            setError(null)
          } else {
            setUserDoc(null)
          }
          setLoading(false)
        },
        (err) => {
          console.error("[useUserDocument] Error:", err)
          setError(err as Error)
          setLoading(false)
        }
      )
    } catch (err) {
      console.error("[useUserDocument] Setup error:", err)
      setError(err as Error)
      setLoading(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [uid])

  return { userDoc, loading, error }
}
