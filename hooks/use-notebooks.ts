/**
 * useNotebooks - Hook for managing notebook list with real-time updates
 */

import { useCallback, useEffect, useState } from "react"
import type { Notebook } from "@/lib/notebook-types"
import { subscribeToNotebooks, listNotebooksPage } from "@/lib/firestore-notebooks"

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
  hasMore: boolean
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
}

export function useNotebooks(userId: string | null, options: UseNotebooksOptions = {}): UseNotebooksReturn {
  const { realtime = true, sortBy = "updatedAt", sortOrder = "desc", projectId, categoryId } = options

  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [cursor, setCursor] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId) {
      setNotebooks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const page = await listNotebooksPage(userId, {
        projectId,
        categoryId,
        sortBy,
        sortOrder,
        limit: 100,
      })
      setNotebooks(page.items)
      setCursor(page.lastDoc)
      setHasMore(page.hasMore)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error("[useNotebooks] Error fetching notebooks:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, projectId, categoryId, sortBy, sortOrder])

  const loadMore = useCallback(async () => {
    if (!userId || !cursor || !hasMore || realtime) return

    try {
      const page = await listNotebooksPage(userId, {
        projectId,
        categoryId,
        sortBy,
        sortOrder,
        limit: 100,
        cursor,
      })
      setNotebooks((prev) => [...prev, ...page.items])
      setCursor(page.lastDoc)
      setHasMore(page.hasMore)
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err))
      setError(nextError)
      console.error("[useNotebooks] Error loading more notebooks:", nextError)
    }
  }, [userId, cursor, hasMore, realtime, projectId, categoryId, sortBy, sortOrder])

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
          setHasMore(data.length >= 100)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
          console.error("[useNotebooks] Subscription error:", err)
        },
        100,
      )
      return unsubscribe
    } else {
      refetch()
    }
  }, [userId, realtime, refetch])

  return { notebooks, loading, error, hasMore, refetch, loadMore }
}
