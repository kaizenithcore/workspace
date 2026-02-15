"use client"

import * as React from "react"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGoals } from "@/lib/hooks/use-goals"
import type { ReportFilters, ReportData, DateRange } from "@/lib/types-reports"
import {
  generateDailyBuckets,
  calculateFocusScore,
  calculateStreakData,
  calculateStdDevHours,
  calculateProjectDistribution,
  calculateCategoryDistribution,
  calculateGoalProgressWithProjection,
  calculateDelta,
} from "@/lib/reports/calculations"
import { generateInsights } from "@/lib/reports/insights"

/**
 * Get date range for a given period type
 */
export function getDateRange(range: ReportFilters["range"], customRange?: DateRange): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case "week": {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Sunday
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      return { start: weekStart, end: weekEnd }
    }

    case "month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start: monthStart, end: monthEnd }
    }

    case "year": {
      const yearStart = new Date(today.getFullYear(), 0, 1)
      const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start: yearStart, end: yearEnd }
    }

    case "custom":
      return customRange || { start: today, end: today }

    default:
      return { start: today, end: today }
  }
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime()
  const previousEnd = new Date(range.start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration)
  return { start: previousStart, end: previousEnd }
}

/**
 * Hook to generate report data
 */
export function useReports(filters: ReportFilters): {
  data: ReportData | null
  loading: boolean
  error: Error | null
} {
  const { tasks, timeEntries, pomodoroSessions, categories, projects } = useDataStore()
  const { goals } = useGoals()

  const [data, setData] = React.useState<ReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    try {
      setLoading(true)

      const period = getDateRange(filters.range, filters.customRange)
      const previousPeriod = filters.compareWithPrevious ? getPreviousPeriod(period) : undefined

      // Filter data by scope
      let filteredTasks = tasks
      let filteredTimeEntries = timeEntries
      let filteredGoals = goals.filter((g) => g.status === "active")

      if (filters.scope === "project" && filters.projectId) {
        filteredTasks = tasks.filter((t) => t.projectId === filters.projectId)
        filteredTimeEntries = timeEntries.filter((e) =>
          e.projectIds?.includes(filters.projectId!)
        )
        filteredGoals = goals.filter((g) => g.projectIds?.includes(filters.projectId!))
      } else if (filters.scope === "category" && filters.categoryId) {
        filteredTasks = tasks.filter((t) => t.categoryIds?.includes(filters.categoryId!))
        filteredTimeEntries = timeEntries.filter((e) =>
          e.categoryIds?.includes(filters.categoryId!)
        )
        filteredGoals = goals.filter((g) => g.categoryIds?.includes(filters.categoryId!))
      } else if (filters.scope === "goals") {
        filteredGoals = goals.filter((g) => g.status === "active" && g.includeInChallenges)
      }

      // Generate daily buckets
      const dailyBuckets = generateDailyBuckets(
        period,
        filteredTasks,
        filteredTimeEntries,
        pomodoroSessions
      )

      // Calculate current period stats
      const totalTimeSeconds = dailyBuckets.reduce((sum, b) => sum + b.timeSeconds, 0)
      const tasksCompleted = dailyBuckets.reduce((sum, b) => sum + b.tasksCompleted, 0)
      const pomodorosCompleted = dailyBuckets.reduce(
        (sum, b) => sum + b.pomodorosCompleted,
        0
      )

      // Calculate previous period stats
      let previousStats
      if (previousPeriod) {
        const previousBuckets = generateDailyBuckets(
          previousPeriod,
          filteredTasks,
          filteredTimeEntries,
          pomodoroSessions
        )
        previousStats = {
          totalTimeSeconds: previousBuckets.reduce((sum, b) => sum + b.timeSeconds, 0),
          tasksCompleted: previousBuckets.reduce((sum, b) => sum + b.tasksCompleted, 0),
          pomodorosCompleted: previousBuckets.reduce((sum, b) => sum + b.pomodorosCompleted, 0),
        }
      }

      // Calculate consistency metrics
      const activeDays = dailyBuckets.filter(
        (b) => b.tasksCompleted > 0 || b.pomodorosCompleted > 0 || b.timeSeconds > 0
      ).length
      const totalDays = dailyBuckets.length
      const activePercentage = totalDays > 0 ? (activeDays / totalDays) * 100 : 0
      const stdDevHours = calculateStdDevHours(dailyBuckets)
      const streak = calculateStreakData(filteredTasks)

      // Calculate distributions
      const projectDistribution = calculateProjectDistribution(
        filteredTimeEntries,
        filteredTasks,
        projects,
        period
      )
      const categoryDistribution = calculateCategoryDistribution(
        filteredTimeEntries,
        filteredTasks,
        categories,
        period
      )

      // Calculate goal progress
      const goalProgress = filteredGoals.map((goal) =>
        calculateGoalProgressWithProjection(goal, period, projects, categories)
      )

      // Calculate focus score
      const topProjectTime = projectDistribution[0]?.timeSeconds || 0
      const focusScore = calculateFocusScore(
        activeDays,
        totalDays,
        topProjectTime,
        totalTimeSeconds,
        streak.current,
        14, // Target streak
        filteredGoals
      )

      // Generate insights
      const insights = generateInsights({
        currentStats: { totalTimeSeconds, tasksCompleted, pomodorosCompleted },
        previousStats,
        activePercentage,
        streak,
        projectDistribution,
        goalProgress,
      })

      const reportData: ReportData = {
        period,
        previousPeriod,
        stats: {
          totalTimeSeconds,
          tasksCompleted,
          pomodorosCompleted,
          focusScore,
        },
        previousStats,
        consistency: {
          activeDays,
          totalDays,
          activePercentage,
          stdDevHours,
          streak,
        },
        dailyBuckets,
        projectDistribution,
        categoryDistribution,
        goalProgress,
        insights,
      }

      setData(reportData)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [
    filters,
    tasks,
    timeEntries,
    pomodoroSessions,
    categories,
    projects,
    goals,
  ])

  return { data, loading, error }
}

/**
 * Hook for quick report insights (dashboard widget)
 */
export function useQuickReportInsights() {
  const weekFilters: ReportFilters = {
    range: "week",
    compareWithPrevious: true,
    scope: "global",
  }

  const { data, loading } = useReports(weekFilters)

  return {
    insights: data?.insights.slice(0, 3) || [],
    focusScore: data?.stats.focusScore.total || 0,
    loading,
  }
}
