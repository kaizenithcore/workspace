import { useEffect, useState } from "react"
import type { Goal, Task, TimeEntry, PomodoroSession, Category, Project } from "@/lib/types"

export interface GoalProgressResult {
  value: number
  display: string
  percentage: number
  isCompleted: boolean
  itemsContributing: number
}

/**
 * Calculate goal progress based on tasks, time entries, or pomodoro sessions
 */
export function calculateGoalProgress(
  goal: Goal,
  tasks: Task[],
  timeEntries: TimeEntry[],
  pomodoroSessions: PomodoroSession[],
  categories: Category[],
  projects: Project[]
): GoalProgressResult {
  const relevantTasks = filterByAssociation(tasks, goal.categoryIds ?? undefined, goal.projectIds ?? undefined)
  const relevantEntries = filterByAssociation(timeEntries, goal.categoryIds ?? undefined, goal.projectIds ?? undefined)
  const relevantSessions = filterByAssociation(pomodoroSessions, goal.categoryIds ?? undefined, goal.projectIds ?? undefined)

  let value = 0
  let itemsContributing = 0

  switch (goal.autoCalcSource) {
    case "tasks": {
      const completedTasks = relevantTasks.filter((t) => t.completed).length
      value = completedTasks
      itemsContributing = completedTasks
      break
    }

    case "time_entries": {
      const totalSeconds = relevantEntries.reduce((sum, entry) => sum + entry.duration, 0)
      if (goal.unit === "hours") {
        value = Math.round(totalSeconds / 3600)
      } else if (goal.unit === "minutes") {
        value = Math.round(totalSeconds / 60)
      } else {
        value = totalSeconds
      }
      itemsContributing = relevantEntries.length
      break
    }

    case "pomodoro_sessions": {
      const completedSessions = relevantSessions.filter((s) => s.type === "pomodoro").length
      value = completedSessions
      itemsContributing = completedSessions
      break
    }

    case "manual":
      // Value is whatever is in goal.current, don't auto-calculate
      value = goal.current
      break
  }

  const percentage = goal.target > 0 ? Math.round((value / goal.target) * 100) : 0
  const isCompleted = value >= goal.target

  return {
    value,
    display: formatGoalValue(value, goal.unit),
    percentage: Math.min(percentage, 100),
    isCompleted,
    itemsContributing,
  }
}

/**
 * Calculate streak based on task completion dates
 */
export function calculateStreak(tasks: Task[], categoryIds?: string[], projectIds?: string[]): number {
  const relevantTasks = filterByAssociation(tasks, categoryIds, projectIds)
  const completedTasks = relevantTasks.filter((t) => t.completed)

  if (completedTasks.length === 0) return 0

  // Sort by date descending
  const sortedByDate = completedTasks.sort((a, b) => (b.updatedAt.getTime() - a.updatedAt.getTime()))

  // Check consecutive days
  let streak = 1
  let currentDate = new Date(sortedByDate[0].updatedAt)
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 1; i < sortedByDate.length; i++) {
    const prev = new Date(sortedByDate[i].updatedAt)
    prev.setHours(0, 0, 0, 0)

    const diffTime = currentDate.getTime() - prev.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      streak++
      currentDate = prev
    } else {
      break
    }
  }

  return streak
}

/**
 * Format goal value with unit for display
 */
export function formatGoalValue(value: number, unit: string): string {
  switch (unit) {
    case "hours":
      return `${value}h`
    case "minutes":
      return `${value}m`
    case "seconds":
      return `${value}s`
    case "percent":
      return `${value}%`
    case "days":
      return `${value}d`
    default:
      return String(value)
  }
}

/**
 * Filter items by associated categories and/or projects
 */
function filterByAssociation<T extends { categoryIds?: string[]; projectIds?: string[] }>(
  items: T[],
  categoryIds?: string[],
  projectIds?: string[]
): T[] {
  if (!categoryIds && !projectIds) {
    return items
  }

  return items.filter((item) => {
    const itemCategories = item.categoryIds || []
    const itemProjects = item.projectIds || []

    const matchesCategory = categoryIds && categoryIds.length > 0 ? categoryIds.some((cid) => itemCategories.includes(cid)) : true

    const matchesProject = projectIds && projectIds.length > 0 ? projectIds.some((pid) => itemProjects.includes(pid)) : true

    return matchesCategory && matchesProject
  })
}

/**
 * Get a description of the goal's progress
 */
export function getGoalProgressDescription(goal: Goal, progress: GoalProgressResult, includeDate?: boolean): string {
  const percentage = progress.percentage
  const display = `${progress.value}/${goal.target} ${goal.unit}`

  let description = `${display} (${percentage}%)`

  if (goal.type === "streak") {
    description = `${progress.display} day streak`
  }

  if (includeDate && goal.dueDate) {
    const daysUntil = Math.ceil((goal.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntil > 0) {
      description += ` — ${daysUntil} days left`
    }
  }

  return description
}
