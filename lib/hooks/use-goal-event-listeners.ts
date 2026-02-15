"use client"

import { useCallback, useEffect } from "react"
import { useUser } from "@/lib/firebase/hooks"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGoals } from "@/lib/hooks/use-goals"
import { useI18n } from "@/lib/hooks/use-i18n"
import { incrementGoalProgress } from "@/lib/firestore-goals"
import { evaluateChallenges } from "@/lib/hooks/use-challenge-management"
import { useToast } from "@/hooks/use-toast"
import type { Goal } from "@/lib/types"

/**
 * Hook that automatically updates goals when tasks are completed, time entries are added, or pomodoro sessions are completed
 * This should be used at the app level to listen for events
 */
export function useGoalEventListeners() {
  const { user } = useUser()
  const { tasks, timeEntries, pomodoroSessions } = useDataStore()
  const { goals } = useGoals()
  const { toast } = useToast()
  const { t } = useI18n()

  const showGoalProgressToast = useCallback((goal: Goal, delta: number) => {
    if (delta <= 0) return

    const newCurrent = Math.min(goal.current + delta, goal.target)
    const description = formatTemplate(t("goals.progressToastDescription"), {
      goal: goal.title,
      delta,
      current: newCurrent,
      target: goal.target,
    })

    toast({
      title: t("goals.progressToastTitle"),
      description,
    })
  }, [t, toast])

  // Track previous states to detect new events
  useEffect(() => {
    if (!user?.uid) return

    // Store task completion states in session storage to detect changes
    const prevTaskIds = new Set(
      (JSON.parse(sessionStorage.getItem("prev-completed-tasks") || "[]") as string[])
    )
    const currentTaskIds = new Set(
      tasks.filter((t) => t.completed).map((t) => t.id)
    )

    // Find newly completed tasks
    for (const taskId of currentTaskIds) {
      if (!prevTaskIds.has(taskId)) {
        // This task was just completed
        const task = tasks.find((t) => t.id === taskId)
        if (task) {
          handleTaskCompleted(user.uid, task, goals, showGoalProgressToast)
        }
      }
    }

    sessionStorage.setItem(
      "prev-completed-tasks",
      JSON.stringify(Array.from(currentTaskIds))
    )
  }, [user?.uid, tasks, goals, showGoalProgressToast])

  // Monitor for new time entries
  useEffect(() => {
    if (!user?.uid) return

    const prevEntryCount = parseInt(
      sessionStorage.getItem("prev-time-entries-count") || "0"
    )
    if (timeEntries.length > prevEntryCount) {
      // New time entries added
      const newEntries = timeEntries.slice(prevEntryCount)
      for (const entry of newEntries) {
        handleTimeEntryAdded(user.uid, entry, goals, showGoalProgressToast)
      }
    }

    sessionStorage.setItem("prev-time-entries-count", String(timeEntries.length))
  }, [user?.uid, timeEntries, goals, showGoalProgressToast])

  // Monitor for new pomodoro sessions
  useEffect(() => {
    if (!user?.uid) return

    const prevSessionCount = parseInt(
      sessionStorage.getItem("prev-pomodoro-sessions-count") || "0"
    )
    if (pomodoroSessions.length > prevSessionCount) {
      // New sessions added
      const newSessions = pomodoroSessions.slice(prevSessionCount)
      for (const session of newSessions) {
        if (session.type === "pomodoro") {
          handlePomodoroCompleted(user.uid, session, goals, showGoalProgressToast)
        }
      }
    }

    sessionStorage.setItem("prev-pomodoro-sessions-count", String(pomodoroSessions.length))
  }, [user?.uid, pomodoroSessions, goals, showGoalProgressToast])

  // Evaluate challenges periodically
  useEffect(() => {
    if (!user?.uid) return

    // Evaluate challenges every minute or when key data changes
    const interval = setInterval(() => {
      evaluateChallenges(user.uid, tasks, pomodoroSessions, timeEntries)
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [user?.uid, tasks, pomodoroSessions, timeEntries])
}

/**
 * Handle task completion - update relevant goals
 */
async function handleTaskCompleted(
  userId: string,
  task: any,
  goals: Goal[],
  notifyProgress: (goal: Goal, delta: number) => void,
) {
  // Find goals that should be incremented
  const relevantGoals = goals.filter((g) => {
    if (g.autoCalcSource !== "tasks") return false
    if (!g.categoryIds && !g.projectIds) return true // Global goal

    const categoryMatch = g.categoryIds?.some((cid) =>
      task.categoryIds?.includes(cid)
    )
    const projectMatch = g.projectIds?.some((pid) => task.projectId === pid)

    return categoryMatch || projectMatch
  })

  // Increment goals based on type
  for (const goal of relevantGoals) {
    if (goal.type === "count") {
      // Count-based: increment by 1
      await incrementGoalProgress(userId, goal.id, 1, "task_completed", task.id)
      notifyProgress(goal, 1)
    } else if (goal.type === "streak") {
      // Streak-based: will be calculated separately
      // Just mark the event
      await incrementGoalProgress(userId, goal.id, 0, "task_completed", task.id)
    }
  }
}

/**
 * Handle time entry addition - update relevant goals
 */
async function handleTimeEntryAdded(
  userId: string,
  entry: any,
  goals: Goal[],
  notifyProgress: (goal: Goal, delta: number) => void,
) {
  // Find goals that should be incremented
  const relevantGoals = goals.filter((g) => {
    if (g.autoCalcSource !== "time_entries") return false
    if (!g.categoryIds && !g.projectIds) return true

    const categoryMatch = g.categoryIds?.some((cid) =>
      entry.categoryIds?.includes(cid)
    )
    const projectMatch = g.projectIds?.some((pid) =>
      entry.projectIds?.includes(pid)
    )

    return categoryMatch || projectMatch
  })

  for (const goal of relevantGoals) {
    if (goal.type === "time") {
      // Time-based: increment by duration in appropriate unit
      let delta = entry.duration || 0
      if (goal.unit === "minutes") {
        delta = Math.round(delta / 60)
      } else if (goal.unit === "hours") {
        delta = Math.round(delta / 3600)
      }
      await incrementGoalProgress(userId, goal.id, delta, "time_entry", entry.id)
      notifyProgress(goal, delta)
    }
  }
}

/**
 * Handle pomodoro completion - update relevant goals
 */
async function handlePomodoroCompleted(
  userId: string,
  session: any,
  goals: Goal[],
  notifyProgress: (goal: Goal, delta: number) => void,
) {
  // Find goals that should be incremented
  const relevantGoals = goals.filter((g) => {
    if (g.autoCalcSource !== "pomodoro_sessions") return false
    if (!g.categoryIds && !g.projectIds) return true

    const categoryMatch = g.categoryIds?.some((cid) =>
      session.categoryIds?.includes(cid)
    )
    const projectMatch = g.projectIds?.some((pid) =>
      session.projectIds?.includes(pid)
    )

    return categoryMatch || projectMatch
  })

  for (const goal of relevantGoals) {
    if (goal.type === "count" || goal.unit === "pomodoros") {
      // Increment by 1 pomodoro
      await incrementGoalProgress(userId, goal.id, 1, "pomodoro", session.id)
      notifyProgress(goal, 1)
    }
  }
}

function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  )
}
