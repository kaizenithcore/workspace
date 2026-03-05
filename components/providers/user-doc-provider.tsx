"use client"

import * as React from "react"
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useUser } from "@/lib/firebase/hooks"
import type { UserDocument } from "@/lib/firestore-user"

interface UserDocContextValue {
  uid: string | null
  userDoc: UserDocument | null
  loading: boolean
  error: Error | null
}

const UserDocContext = React.createContext<UserDocContextValue | null>(null)

function convertUserDoc(snapshotData: Record<string, any>): UserDocument {
  const convertedData = { ...snapshotData }
  if (snapshotData.createdAt?.toDate) {
    convertedData.createdAt = snapshotData.createdAt.toDate()
  }
  return convertedData as UserDocument
}

export function UserDocProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser()
  const [userDoc, setUserDoc] = React.useState<UserDocument | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user?.uid) {
      setUserDoc(null)
      setError(null)
      setLoading(false)
      return
    }

    let isMounted = true
    let unsubscribe: Unsubscribe | null = null

    setLoading(true)
    setError(null)

    try {
      const userRef = doc(db, "users", user.uid)
      unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (!isMounted) return

          if (snapshot.exists()) {
            setUserDoc(convertUserDoc(snapshot.data() as Record<string, any>))
          } else {
            setUserDoc(null)
          }

          setLoading(false)
          setError(null)
        },
        (snapshotError) => {
          if (!isMounted) return
          setError(snapshotError as Error)
          setLoading(false)
        }
      )
    } catch (setupError) {
      if (!isMounted) return
      setError(setupError as Error)
      setLoading(false)
    }

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [user?.uid, authLoading])

  const value = React.useMemo<UserDocContextValue>(
    () => ({
      uid: user?.uid ?? null,
      userDoc,
      loading: authLoading || loading,
      error,
    }),
    [user?.uid, userDoc, loading, authLoading, error]
  )

  return <UserDocContext.Provider value={value}>{children}</UserDocContext.Provider>
}

export function useOptionalUserDocContext() {
  return React.useContext(UserDocContext)
}
