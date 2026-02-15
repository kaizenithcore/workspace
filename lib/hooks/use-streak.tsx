"use client"

import { useEffect, useState } from "react"
import type { Task } from "@/lib/types"

export interface StreakInfo {
  current: number
  best: number
  lastDay: Date | null
}

/**
 * Calculate current and best streaks based on task completion dates
 */
export function calculateStreakInfo(tasks: Task[]): StreakInfo {
  const completedTasks = tasks.filter((t) => t.completed)

  if (completedTasks.length === 0) {
    return {
      current: 0,
      best: 0,
      lastDay: null,
    }
  }

  // Sort by update date descending
  const sorted = [...completedTasks].sort((a, b) => {
    return toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime()
  })

  // Calculate streaks by grouping consecutive days
  const streaks: number[] = []
  let currentStreak = 1
  let currentDate = toDate(sorted[0].updatedAt)
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = toDate(sorted[i].updatedAt)
    prevDate.setHours(0, 0, 0, 0)

    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++
      currentDate = prevDate
    } else if (diffDays > 1) {
      // Gap in streak - save the current streak and start a new one
      streaks.push(currentStreak)
      currentStreak = 1
      currentDate = prevDate
    }
    // If diffDays === 0, tasks on the same day don't break the streak
  }

  // Save the last streak
  streaks.push(currentStreak)

  // Check if current streak is still active (last completed task was today or yesterday)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastCompletedDate = toDate(sorted[0].updatedAt)
  lastCompletedDate.setHours(0, 0, 0, 0)

  let activeCurrent = 0
  if (
    lastCompletedDate.getTime() === today.getTime() ||
    lastCompletedDate.getTime() === yesterday.getTime()
  ) {
    activeCurrent = streaks[streaks.length - 1]
  }

  const best = Math.max(...streaks)

  return {
    current: activeCurrent,
    best,
    lastDay: sorted[0] ? toDate(sorted[0].updatedAt) : null,
  }
}

/**
 * Hook to track streak updates
 */
export function useStreak(tasks: Task[]) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(() =>
    calculateStreakInfo(tasks)
  )

  useEffect(() => {
    setStreakInfo(calculateStreakInfo(tasks))
  }, [tasks])

  return streakInfo
}

/**
 * Check if user completed at least one task today
 */
export function hasCompletedTaskToday(tasks: Task[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return tasks.some((t) => {
    if (!t.completed) return false
    const taskDate = toDate(t.updatedAt)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === today.getTime()
  })
}

/**
 * Count completed tasks in the current week
 */
export function getWeeklyTaskCount(tasks: Task[]): number {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)

  return tasks.filter((t) => {
    if (!t.completed) return false
    const taskDate = toDate(t.updatedAt)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() >= weekStart.getTime()
  }).length
}

/**
 * Count completed tasks in the current month
 */
export function getMonthlyTaskCount(tasks: Task[]): number {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)

  return tasks.filter((t) => {
    if (!t.completed) return false
    const taskDate = toDate(t.updatedAt)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() >= monthStart.getTime()
  }).length
}

/**
 * Count pomodoro sessions completed today
 */
export function getTodayPomodoroCount(pomodoroSessions: any[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return pomodoroSessions.filter((s) => {
    if (s.type !== "pomodoro") return false
    const sessionDate = toDate(s.completedAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === today.getTime()
  }).length
}

/**
 * Count pomodoro sessions completed in the current week
 */
export function getWeeklyPomodoroCount(pomodoroSessions: any[]): number {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)

  return pomodoroSessions.filter((s) => {
    if (s.type !== "pomodoro") return false
    const sessionDate = toDate(s.completedAt)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() >= weekStart.getTime()
  }).length
}

/**
 * Count total minutes tracked today
 */
export function getTodayTrackedMinutes(timeEntries: any[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.round(
    timeEntries
      .filter((e) => {
        const entryDate = toDate(e.startTime)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      .reduce((sum, e) => sum + (e.duration || 0), 0) / 60
  )
}

/**
 * Count total minutes tracked in the current month
 */
export function getMonthlyTrackedMinutes(timeEntries: any[]): number {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)

  return Math.round(
    timeEntries
      .filter((e) => {
        const entryDate = toDate(e.startTime)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() >= monthStart.getTime()
      })
      .reduce((sum, e) => sum + (e.duration || 0), 0) / 60
  )
}

function toDate(value: any): Date {
  if (value instanceof Date) return value
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate()
  }
  return new Date(value)
}
