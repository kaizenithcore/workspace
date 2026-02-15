"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import type { Task } from "@/lib/types"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useAppSettings } from "@/lib/hooks/use-app-settings"

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak"

interface PomodoroState {
  isRunning: boolean
  phase: PomodoroPhase
  secondsRemaining: number
  totalSeconds: number
  pomodorosCompleted: number
  boundTask: Task | null
  focusSeconds: number
  shortBreakSeconds: number
  longBreakSeconds: number
}

interface GlobalPomodoroContextValue extends PomodoroState {
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  setPhase: (phase: PomodoroPhase) => void
  setTotalSeconds: (seconds: number) => void
  setDurations: (durations: { focusSeconds: number; shortBreakSeconds: number; longBreakSeconds: number }) => void
  bindTask: (task: Task | null) => void
  completePomodoro: () => void
  resetPomodoros: () => void
}

const GlobalPomodoroContext = React.createContext<GlobalPomodoroContextValue | undefined>(undefined)

const DEFAULT_FOCUS_SECONDS = 25 * 60
const DEFAULT_SHORT_BREAK_SECONDS = 5 * 60
const DEFAULT_LONG_BREAK_SECONDS = 15 * 60

type CompletionEvent = {
  phase: PomodoroPhase
  duration: number
  completedAt: Date
  boundTask: Task | null
}

const SESSION_TYPE_BY_PHASE = {
  focus: "pomodoro",
  shortBreak: "short_break",
  longBreak: "long_break",
} as const

const getPhaseDuration = (phase: PomodoroPhase, state: Pick<PomodoroState, "focusSeconds" | "shortBreakSeconds" | "longBreakSeconds">) => {
  if (phase === "focus") return state.focusSeconds
  if (phase === "shortBreak") return state.shortBreakSeconds
  return state.longBreakSeconds
}

export function GlobalPomodoroProvider({ children }: { children: React.ReactNode }) {
  const { addSession } = useDataStore()
  const { settings } = useAppSettings()
  const defaultState: PomodoroState = {
    isRunning: false,
    phase: "focus",
    secondsRemaining: DEFAULT_FOCUS_SECONDS,
    totalSeconds: DEFAULT_FOCUS_SECONDS,
    pomodorosCompleted: 0,
    boundTask: null,
    focusSeconds: DEFAULT_FOCUS_SECONDS,
    shortBreakSeconds: DEFAULT_SHORT_BREAK_SECONDS,
    longBreakSeconds: DEFAULT_LONG_BREAK_SECONDS,
  }

  const [savedState, setSavedState, isStorageLoaded] = useLocalStorage<PomodoroState>(
    "global-pomodoro-state",
    defaultState,
  )

  const normalizeNumber = (value: unknown, fallback: number) => {
    const num = typeof value === "number" ? value : Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  const normalizeState = (raw: Partial<PomodoroState>, base: PomodoroState): PomodoroState => {
    const focusSeconds = normalizeNumber(raw.focusSeconds, base.focusSeconds)
    const shortBreakSeconds = normalizeNumber(raw.shortBreakSeconds, base.shortBreakSeconds)
    const longBreakSeconds = normalizeNumber(raw.longBreakSeconds, base.longBreakSeconds)
    const totalSeconds = Math.max(1, normalizeNumber(raw.totalSeconds, base.totalSeconds))
    const secondsRemainingRaw = normalizeNumber(raw.secondsRemaining, base.secondsRemaining)
    const secondsRemaining = Math.min(Math.max(0, secondsRemainingRaw), totalSeconds)
    const phase = raw.phase === "focus" || raw.phase === "shortBreak" || raw.phase === "longBreak" ? raw.phase : base.phase

    return {
      ...base,
      ...raw,
      isRunning: Boolean(raw.isRunning ?? base.isRunning),
      phase,
      totalSeconds,
      secondsRemaining,
      focusSeconds,
      shortBreakSeconds,
      longBreakSeconds,
      boundTask: raw.boundTask ?? base.boundTask,
      pomodorosCompleted: Math.max(0, normalizeNumber(raw.pomodorosCompleted, base.pomodorosCompleted)),
    }
  }

  const isSameState = (a: PomodoroState, b: PomodoroState) =>
    a.isRunning === b.isRunning &&
    a.phase === b.phase &&
    a.secondsRemaining === b.secondsRemaining &&
    a.totalSeconds === b.totalSeconds &&
    a.pomodorosCompleted === b.pomodorosCompleted &&
    a.focusSeconds === b.focusSeconds &&
    a.shortBreakSeconds === b.shortBreakSeconds &&
    a.longBreakSeconds === b.longBreakSeconds &&
    a.boundTask?.id === b.boundTask?.id

  const [state, setState] = React.useState<PomodoroState>(() =>
    normalizeState(savedState, defaultState),
  )
  const [completionEvent, setCompletionEvent] = React.useState<CompletionEvent | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout>(null)

  // Sync state to localStorage
  React.useEffect(() => {
    setSavedState(state)
  }, [state, setSavedState])

  React.useEffect(() => {
    if (!isStorageLoaded) return

    setState((prev) => {
      const normalized = normalizeState(savedState, prev)
      return isSameState(prev, normalized) ? prev : normalized
    })
  }, [isStorageLoaded, savedState])

  React.useEffect(() => {
    const focusSeconds = Math.max(1, settings.pomodoroDuration) * 60
    const shortBreakSeconds = Math.max(1, settings.shortBreakDuration) * 60
    const longBreakSeconds = Math.max(1, settings.longBreakDuration) * 60

    setState((prev) => {
      const nextDurations = { focusSeconds, shortBreakSeconds, longBreakSeconds }
      const nextTotal = getPhaseDuration(prev.phase, nextDurations)
      const shouldReset = !prev.isRunning && prev.secondsRemaining === prev.totalSeconds

      return {
        ...prev,
        ...nextDurations,
        totalSeconds: nextTotal,
        secondsRemaining: shouldReset ? nextTotal : prev.secondsRemaining,
      }
    })
  }, [settings.pomodoroDuration, settings.shortBreakDuration, settings.longBreakDuration])

  // Timer tick effect
  React.useEffect(() => {
    if (state.isRunning && state.secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.secondsRemaining <= 1) {
            const completedAt = new Date()
            setCompletionEvent({
              phase: prev.phase,
              duration: prev.totalSeconds,
              completedAt,
              boundTask: prev.boundTask,
            })

            const nextPomodorosCompleted =
              prev.phase === "focus" ? prev.pomodorosCompleted + 1 : prev.pomodorosCompleted
            const nextPhase: PomodoroPhase =
              prev.phase === "focus"
                ? nextPomodorosCompleted % 4 === 0
                  ? "longBreak"
                  : "shortBreak"
                : "focus"
            const nextTotal = getPhaseDuration(nextPhase, prev)

            return {
              ...prev,
              isRunning: false,
              pomodorosCompleted: nextPomodorosCompleted,
              phase: nextPhase,
              totalSeconds: nextTotal,
              secondsRemaining: nextTotal,
            }
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1,
          }
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.isRunning, state.secondsRemaining])

  React.useEffect(() => {
    if (!completionEvent) return

    addSession({
      taskId: completionEvent.boundTask?.id,
      projectIds: completionEvent.boundTask?.projectId ? [completionEvent.boundTask.projectId] : [],
      categoryIds: completionEvent.boundTask?.categoryIds ?? [],
      type: SESSION_TYPE_BY_PHASE[completionEvent.phase],
      duration: completionEvent.duration,
      completedAt: completionEvent.completedAt,
    })

    setCompletionEvent(null)
  }, [completionEvent, addSession])

  const startTimer = React.useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }))
  }, [])

  const pauseTimer = React.useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }))
  }, [])

  const resetTimer = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      secondsRemaining: prev.totalSeconds,
    }))
  }, [])

  const setPhase = React.useCallback((phase: PomodoroPhase) => {
    setState((prev) => ({
      ...prev,
      phase,
      totalSeconds: getPhaseDuration(phase, prev),
      secondsRemaining: getPhaseDuration(phase, prev),
      isRunning: false,
    }))
  }, [])

  const setTotalSeconds = React.useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      totalSeconds: seconds,
      secondsRemaining: seconds,
    }))
  }, [])

  const setDurations = React.useCallback(
    (durations: { focusSeconds: number; shortBreakSeconds: number; longBreakSeconds: number }) => {
      setState((prev) => {
        const nextTotal = getPhaseDuration(prev.phase, durations)
        const shouldReset = !prev.isRunning && prev.secondsRemaining === prev.totalSeconds

        return {
          ...prev,
          ...durations,
          totalSeconds: nextTotal,
          secondsRemaining: shouldReset ? nextTotal : prev.secondsRemaining,
        }
      })
    },
    [],
  )

  const bindTask = React.useCallback((task: Task | null) => {
    setState((prev) => ({ ...prev, boundTask: task }))
  }, [])

  const completePomodoro = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      pomodorosCompleted: prev.pomodorosCompleted + 1,
    }))
  }, [])

  const resetPomodoros = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      pomodorosCompleted: 0,
    }))
  }, [])

  const value = React.useMemo(
    () => ({
      ...state,
      startTimer,
      pauseTimer,
      resetTimer,
      setPhase,
      setTotalSeconds,
      setDurations,
      bindTask,
      completePomodoro,
      resetPomodoros,
    }),
    [
      state,
      startTimer,
      pauseTimer,
      resetTimer,
      setPhase,
      setTotalSeconds,
      setDurations,
      bindTask,
      completePomodoro,
      resetPomodoros,
    ],
  )

  return <GlobalPomodoroContext.Provider value={value}>{children}</GlobalPomodoroContext.Provider>
}

export function useGlobalPomodoro() {
  const context = React.useContext(GlobalPomodoroContext)
  if (!context) {
    throw new Error("useGlobalPomodoro must be used within GlobalPomodoroProvider")
  }
  return context
}
