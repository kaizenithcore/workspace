"use client"

import { useEffect } from "react"
import { useGoalEventListeners } from "@/lib/hooks/use-goal-event-listeners"

/**
 * Component that initializes goal event listeners
 * Placed at the app level to listen for all task/time entry/pomodoro events
 */
export function GoalEventsManager() {
  useGoalEventListeners()
  return null
}
