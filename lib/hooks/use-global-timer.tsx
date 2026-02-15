"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"

interface TimerState {
  isTracking: boolean
  description: string
  categoryId: string
  projectId: string
  startTime: string | null
}

interface TimeEntry {
  description: string
  startTime: Date
  endTime: Date
  duration: number
  categoryIds: string[]
  projectIds: string[]
}

interface GlobalTimerContextValue {
  isTracking: boolean
  description: string
  categoryId: string
  projectId: string
  startTime: Date | null
  elapsedTime: number
  startTracking: (description: string, categoryId?: string, projectId?: string) => void
  stopTracking: () => TimeEntry | null
  updateDescription: (description: string) => void
  resetTimer: () => void
}

const GlobalTimerContext =
  React.createContext<GlobalTimerContextValue | undefined>(undefined)

export function GlobalTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useLocalStorage<TimerState>("global-time-tracking", {
    isTracking: false,
    description: "",
    categoryId: "",
    projectId: "",
    startTime: null,
  })

  const startTime = timer.startTime ? new Date(timer.startTime) : null
  const [elapsedTime, setElapsedTime] = React.useState(0)

  // Tick
  React.useEffect(() => {
    if (!timer.isTracking || !startTime) return

    setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isTracking, timer.startTime])

  const startTracking = React.useCallback(
    (description: string, categoryId = "", projectId = "") => {
      setTimer({
        isTracking: true,
        description,
        categoryId,
        projectId,
        startTime: new Date().toISOString(),
      })
      setElapsedTime(0)
    },
    [setTimer],
  )

  const stopTracking = React.useCallback((): TimeEntry | null => {
    if (!startTime) return null

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    const entry: TimeEntry = {
      description: timer.description || "Untitled",
      startTime,
      endTime,
      duration,
      categoryIds: timer.categoryId ? [timer.categoryId] : [],
      projectIds: timer.projectId ? [timer.projectId] : [],
    }

    setTimer({
      isTracking: false,
      description: "",
      categoryId: "",
      projectId: "",
      startTime: null,
    })

    setElapsedTime(0)
    return entry
  }, [timer, startTime, setTimer])

  const updateDescription = React.useCallback(
    (description: string) => {
      setTimer({ ...timer, description })
    },
    [timer, setTimer],
  )

  const resetTimer = React.useCallback(() => {
    setTimer({
      isTracking: false,
      description: "",
      categoryId: "",
      projectId: "",
      startTime: null,
    })
    setElapsedTime(0)
  }, [setTimer])

  const value = React.useMemo(
    () => ({
      isTracking: timer.isTracking,
      description: timer.description,
      categoryId: timer.categoryId,
      projectId: timer.projectId,
      startTime,
      elapsedTime,
      startTracking,
      stopTracking,
      updateDescription,
      resetTimer,
    }),
    [timer, startTime, elapsedTime, startTracking, stopTracking, updateDescription, resetTimer],
  )

  return (
    <GlobalTimerContext.Provider value={value}>
      {children}
    </GlobalTimerContext.Provider>
  )
}

export function useGlobalTimer() {
  const ctx = React.useContext(GlobalTimerContext)
  if (!ctx) {
    throw new Error("useGlobalTimer must be used within GlobalTimerProvider")
  }
  return ctx
}
