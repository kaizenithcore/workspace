"use client"

import { useEffect, useState } from "react"
import { subscribeToUserSessionTemplates } from "@/lib/firestore-sessions"
import { useUser } from "@/lib/firebase/hooks"
import type { SessionTemplate } from "@/lib/types"

export function useSessionTemplates() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setTemplates([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserSessionTemplates(
      user.uid,
      (templates) => {
        setTemplates(templates)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  return { templates, loading, error }
}
