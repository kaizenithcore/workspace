"use client"

import { useEffect, useState } from "react"
import { subscribeToUserSessions, subscribeToSessionsByStatus } from "@/lib/firestore-sessions"
import { useUser } from "@/lib/firebase/hooks"
import type { Session } from "@/lib/types"

export function useSessions() {
  const { user } = useUser()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserSessions(
      user.uid,
      (sessions) => {
        setSessions(sessions)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  return { sessions, loading, error }
}

export function useSessionsByStatus(status: Session["status"]) {
  const { user } = useUser()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToSessionsByStatus(
      user.uid,
      status,
      (sessions) => {
        setSessions(sessions)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid, status])

  return { sessions, loading, error }
}

export function useUpcomingSessions() {
  return useSessionsByStatus("planned")
}

export function useActiveSessions() {
  return useSessionsByStatus("active")
}

export function useCompletedSessions() {
  return useSessionsByStatus("completed")
}
