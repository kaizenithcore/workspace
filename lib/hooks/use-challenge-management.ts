"use client"

import { PRESET_CHALLENGES } from "@/lib/types"
import {
  getUserChallenges,
  initializeChallenge,
  updateChallenge,
} from "@/lib/firestore-goals"
import {
  calculateStreakInfo,
  getMonthlyTaskCount,
  getMonthlyTrackedMinutes,
  getWeeklyPomodoroCount,
  getWeeklyTaskCount,
} from "@/lib/hooks/use-streak"
import type { Task, PomodoroSession, TimeEntry } from "@/lib/types"

/**
 * Initialize default challenges for a new user
 */
export async function initializeDefaultChallenges(userId: string) {
  const existing = await getUserChallenges(userId)
  const existingSlugs = new Set(existing.map((challenge) => challenge.slug))
  const now = new Date()

  for (const preset of PRESET_CHALLENGES) {
    if (existingSlugs.has(preset.slug)) continue

    const periodBounds = getPeriodBounds(preset.resetPeriod ?? "none", now)

    const challengePayload: Parameters<typeof initializeChallenge>[1] = {
      slug: preset.slug,
      title: preset.titleKey,
      description: preset.descriptionKey,
      active: true,
      state: "active",
      startedAt: periodBounds?.start ?? now,
      progress: 0,
      target: preset.target,
      resetPeriod: preset.resetPeriod ?? "none",
    }

    if (periodBounds?.end) {
      challengePayload.expiresAt = periodBounds.end
    }

    await initializeChallenge(userId, challengePayload)
  }
}

/**
 * Evaluate and update challenges based on current progress
 */
export async function evaluateChallenges(
  userId: string,
  tasks: Task[],
  pomodoroSessions: PomodoroSession[],
  timeEntries: TimeEntry[]
) {
  const challenges = await getUserChallenges(userId)
  const now = new Date()

  for (const challenge of challenges) {
    if (!challenge.active) {
      continue
    }

    const resetPeriod = challenge.resetPeriod ?? "none"
    const periodBounds = getPeriodBounds(resetPeriod, now)
    const existingExpiresAt = asDate(challenge.expiresAt)
    const shouldReset = resetPeriod !== "none" && (!existingExpiresAt || now > existingExpiresAt)

    if (!shouldReset && challenge.state !== "active") {
      continue
    }

    let newState: "completed" | "failed" | "active" = shouldReset ? "active" : challenge.state
    let newProgress = shouldReset ? 0 : challenge.progress || 0
    let newStartedAt = shouldReset ? periodBounds?.start : asDate(challenge.startedAt)
    let newExpiresAt = shouldReset ? periodBounds?.end : existingExpiresAt

    switch (challenge.slug) {
      case "7-day-streak": {
        const streakInfo = calculateStreakInfo(tasks)
        newProgress = Math.min(streakInfo.current, challenge.target || 7)
        if (newProgress >= (challenge.target || 7)) {
          newState = "completed"
        }
        break
      }

      case "5-tasks-week": {
        const weeklyCount = getWeeklyTaskCount(tasks)
        newProgress = Math.min(weeklyCount, challenge.target || 5)
        if (newProgress >= (challenge.target || 5)) {
          newState = "completed"
        }
        break
      }

      case "14-day-streak": {
        const streakInfo = calculateStreakInfo(tasks)
        newProgress = Math.min(streakInfo.current, challenge.target || 14)
        if (newProgress >= (challenge.target || 14)) {
          newState = "completed"
        }
        break
      }

      case "20-tasks-month": {
        const monthlyCount = getMonthlyTaskCount(tasks)
        newProgress = Math.min(monthlyCount, challenge.target || 20)
        if (newProgress >= (challenge.target || 20)) {
          newState = "completed"
        }
        break
      }

      case "600-min-month": {
        const monthlyMinutes = getMonthlyTrackedMinutes(timeEntries)
        newProgress = Math.min(monthlyMinutes, challenge.target || 600)
        if (newProgress >= (challenge.target || 600)) {
          newState = "completed"
        }
        break
      }

      case "10-pomodoros-week": {
        const weeklyPomodoros = getWeeklyPomodoroCount(pomodoroSessions)
        newProgress = Math.min(weeklyPomodoros, challenge.target || 10)
        if (newProgress >= (challenge.target || 10)) {
          newState = "completed"
        }
        break
      }
    }

    if (
      newProgress !== challenge.progress ||
      newState !== challenge.state ||
      (shouldReset && (newStartedAt || newExpiresAt))
    ) {
      await updateChallenge(userId, challenge.id, {
        progress: newProgress,
        state: newState,
        startedAt: newStartedAt ?? undefined,
        expiresAt: newExpiresAt ?? undefined,
      })
    }
  }
}

function getPeriodBounds(period: "weekly" | "monthly" | "none", now: Date) {
  if (period === "none") return null

  if (period === "weekly") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    end.setMilliseconds(end.getMilliseconds() - 1)

    return { start, end }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  end.setMilliseconds(end.getMilliseconds() - 1)

  return { start, end }
}

function asDate(value?: Date | null): Date | null {
  if (!value) return null
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(value)
}
