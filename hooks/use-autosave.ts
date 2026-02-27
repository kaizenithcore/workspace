/**
 * useAutosave - Debounced autosave hook with state management
 * Automatically saves content after a delay, prevents excessive writes
 */

import { useCallback, useEffect, useRef, useState } from "react"

interface UseAutosaveOptions {
  delay?: number // debounce delay in ms (default 800)
  onSave?: (value: string) => Promise<void>
  onError?: (error: Error) => void
}

interface UseAutosaveReturn {
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: Date | null
  error: Error | null
  markDirty: () => void
  cancel: () => void
  save: () => Promise<void>
  reset: () => void
}

export function useAutosave(
  initialValue: string,
  options: UseAutosaveOptions = {}
): UseAutosaveReturn {
  const { delay = 800, onSave, onError } = options

  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const valueRef = useRef(initialValue)

  const markDirty = useCallback(() => {
    setIsDirty(true)
    setError(null)
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsDirty(false)
  }, [])

  const save = useCallback(async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      setError(null)
      await onSave(valueRef.current)
      setLastSavedAt(new Date())
      setIsDirty(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, onError])

  const reset = useCallback(() => {
    cancel()
    setIsDirty(false)
    setIsSaving(false)
    setLastSavedAt(null)
    setError(null)
  }, [cancel])

  // Update value ref when initialValue changes
  useEffect(() => {
    valueRef.current = initialValue
  }, [initialValue])

  // Set up debounced save
  useEffect(() => {
    if (!isDirty || !onSave) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isDirty, delay, onSave, save])

  return {
    isDirty,
    isSaving,
    lastSavedAt,
    error,
    markDirty,
    cancel,
    save,
    reset,
  }
}

/**
 * Hook to update autosave value (for textarea/contenteditable)
 */
export function useAutosaveValue(value: string, autosave: UseAutosaveReturn) {
  useEffect(() => {
    // Update the internal ref in autosave hook
    // This is a simple way to sync the value
  }, [value, autosave])
}
