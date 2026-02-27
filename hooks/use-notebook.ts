/**
 * useNotebook - Hook for managing a single notebook with its pages
 */

import { useCallback, useEffect, useState } from "react"
import type { Notebook, NotebookPage } from "@/lib/notebook-types"
import { subscribeToNotebook, subscribeToPages, getNotebook, listPages } from "@/lib/firestore-notebooks"

interface UseNotebookOptions {
  realtime?: boolean
}

interface UseNotebookReturn {
  notebook: Notebook | null
  pages: NotebookPage[]
  currentPageIndex: number
  currentPage: NotebookPage | null
  loading: boolean
  error: Error | null
  goToPage: (index: number) => void
  nextPage: () => void
  previousPage: () => void
  refetch: () => Promise<void>
}

export function useNotebook(
  userId: string | null,
  notebookId: string | null,
  options: UseNotebookOptions = {}
): UseNotebookReturn {
  const { realtime = true } = options

  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [pages, setPages] = useState<NotebookPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!userId || !notebookId) {
      setNotebook(null)
      setPages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [notebookData, pagesData] = await Promise.all([
        getNotebook(userId, notebookId),
        listPages(userId, notebookId),
      ])
      setNotebook(notebookData)
      setPages(pagesData)
      setCurrentPageIndex(0)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error("[useNotebook] Error fetching notebook:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, notebookId])

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index)
    }
  }, [pages.length])

  const nextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }, [currentPageIndex, pages.length])

  const previousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }, [currentPageIndex])

  useEffect(() => {
    if (!userId || !notebookId) {
      setNotebook(null)
      setPages([])
      setLoading(false)
      return
    }

    if (realtime) {
      setLoading(true)
      const unsubscribeNotebook = subscribeToNotebook(
        userId,
        notebookId,
        (data) => {
          setNotebook(data)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
          console.error("[useNotebook] Notebook subscription error:", err)
        }
      )

      const unsubscribePages = subscribeToPages(
        userId,
        notebookId,
        (data) => {
          setPages(data)
          // Reset current page index if it's out of bounds
          if (currentPageIndex >= data.length && data.length > 0) {
            setCurrentPageIndex(Math.max(0, data.length - 1))
          }
        },
        (err) => {
          console.error("[useNotebook] Pages subscription error:", err)
        }
      )

      return () => {
        unsubscribeNotebook()
        unsubscribePages()
      }
    } else {
      refetch()
    }
  }, [userId, notebookId, realtime, refetch, currentPageIndex])

  const currentPage = pages[currentPageIndex] || null

  return {
    notebook,
    pages,
    currentPageIndex,
    currentPage,
    loading,
    error,
    goToPage,
    nextPage,
    previousPage,
    refetch,
  }
}
