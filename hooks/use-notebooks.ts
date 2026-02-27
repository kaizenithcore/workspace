/**
 * useNotebooks - Hook for managing notebook list with real-time updates
 */

import { useCallback, useEffect, useState } from "react"
import type { Notebook } from "@/lib/notebook-types"
import { subscribeToNotebooks, listNotebooks } from "@/lib/firestore-notebooks"

interface UseNotebooksOptions {
  realtime?: boolean
  sortBy?: "updatedAt" | "createdAt" | "title"
  sortOrder?: "asc" | "desc"
  projectId?: string
  categoryId?: string
}

interface UseNotebooksReturn {
  notebooks: Notebook[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useNotebooks(userId: string | null, options: UseNotebooksOptions = {}): UseNotebooksReturn {
  const { realtime = true, sortBy = "updatedAt", sortOrder = "desc", projectId, categoryId } = options

  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setNotebooks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await listNotebooks(userId, {
        projectId,
        categoryId,
        sortBy,
        sortOrder,
      })
      setNotebooks(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error("[useNotebooks] Error fetching notebooks:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, projectId, categoryId, sortBy, sortOrder])

  useEffect(() => {
    if (!userId) {
      setNotebooks([])
      setLoading(false)
      return
    }

    if (realtime) {
      setLoading(true)
      const unsubscribe = subscribeToNotebooks(
        userId,
        (data) => {
          setNotebooks(data)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
          console.error("[useNotebooks] Subscription error:", err)
        }
      )
      return unsubscribe
    } else {
      refetch()
    }
  }, [userId, realtime, refetch])

  return { notebooks, loading, error, refetch }
}
