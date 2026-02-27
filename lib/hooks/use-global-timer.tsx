"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"

interface TimerState {
  isTracking: boolean
  isPaused: boolean
  description: string
  categoryId: string
  projectId: string
  startTime: string | null
  pausedTime: number // accumulated paused time in seconds
  lastPauseStart: string | null // timestamp when pause started
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
  isPaused: boolean
  description: string
  categoryId: string
  projectId: string
  startTime: Date | null
  elapsedTime: number
  startTracking: (description: string, categoryId?: string, projectId?: string) => void
  stopTracking: () => TimeEntry | null
  pauseTracking: () => void
  resumeTracking: () => void
  updateDescription: (description: string) => void
  resetTimer: () => void
}

const GlobalTimerContext =
  React.createContext<GlobalTimerContextValue | undefined>(undefined)

export function GlobalTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useLocalStorage<TimerState>("global-time-tracking", {
    isTracking: false,
    isPaused: false,
    description: "",
    categoryId: "",
    projectId: "",
    startTime: null,
    pausedTime: 0,
    lastPauseStart: null,
  })

  const startTime = timer.startTime ? new Date(timer.startTime) : null
  const [elapsedTime, setElapsedTime] = React.useState(0)

  // Warn before closing if timer is active
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timer.isTracking) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [timer.isTracking])

  // Tick
  React.useEffect(() => {
    if (!timer.isTracking || !startTime || timer.isPaused) {
      // If paused, keep the elapsed time frozen
      if (timer.isPaused && timer.lastPauseStart && startTime) {
        const pauseStart = new Date(timer.lastPauseStart).getTime()
        const timeUntilPause = Math.floor((pauseStart - startTime.getTime()) / 1000)
        setElapsedTime(Math.max(0, timeUntilPause - timer.pausedTime))
      }
      return
    }

    // Calculate elapsed time excluding paused time
    const calculateElapsed = () => {
      const now = Date.now()
      const totalElapsed = Math.floor((now - startTime.getTime()) / 1000)
      return Math.max(0, totalElapsed - timer.pausedTime)
    }

    setElapsedTime(calculateElapsed())

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isTracking, timer.isPaused, timer.startTime, timer.pausedTime, timer.lastPauseStart])

  const startTracking = React.useCallback(
    (description: string, categoryId = "", projectId = "") => {
      setTimer({
        isTracking: true,
        isPaused: false,
        description,
        categoryId,
        projectId,
        startTime: new Date().toISOString(),
        pausedTime: 0,
        lastPauseStart: null,
      })
      setElapsedTime(0)
    },
    [setTimer],
  )

  const stopTracking = React.useCallback((): TimeEntry | null => {
    if (!startTime) return null

    const endTime = new Date()
    const totalElapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    const duration = Math.max(0, totalElapsed - timer.pausedTime)

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
      isPaused: false,
      description: "",
      categoryId: "",
      projectId: "",
      startTime: null,
      pausedTime: 0,
      lastPauseStart: null,
    })

    setElapsedTime(0)
    return entry
  }, [timer, startTime, setTimer])

  const pauseTracking = React.useCallback(() => {
    if (!timer.isTracking || timer.isPaused) return
    
    setTimer({
      ...timer,
      isPaused: true,
      lastPauseStart: new Date().toISOString(),
    })
  }, [timer, setTimer])

  const resumeTracking = React.useCallback(() => {
    if (!timer.isPaused || !timer.lastPauseStart) return

    const pauseStart = new Date(timer.lastPauseStart).getTime()
    const pauseDuration = Math.floor((Date.now() - pauseStart) / 1000)
    
    setTimer({
      ...timer,
      isPaused: false,
      pausedTime: timer.pausedTime + pauseDuration,
      lastPauseStart: null,
    })
  }, [timer, setTimer])

  const updateDescription = React.useCallback(
    (description: string) => {
      setTimer({ ...timer, description })
    },
    [timer, setTimer],
  )

  const resetTimer = React.useCallback(() => {
    setTimer({
      isTracking: false,
      isPaused: false,
      description: "",
      categoryId: "",
      projectId: "",
      startTime: null,
      pausedTime: 0,
      lastPauseStart: null,
    })
    setElapsedTime(0)
  }, [setTimer])

  const value = React.useMemo(
    () => ({
      isTracking: timer.isTracking,
      isPaused: timer.isPaused,
      description: timer.description,
      categoryId: timer.categoryId,
      projectId: timer.projectId,
      startTime,
      elapsedTime,
      startTracking,
      stopTracking,
      pauseTracking,
      resumeTracking,
      updateDescription,
      resetTimer,
    }),
    [timer, startTime, elapsedTime, startTracking, stopTracking, pauseTracking, resumeTracking, updateDescription, resetTimer],
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
