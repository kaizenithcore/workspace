import type {
  Task,
  TimeEntry,
  PomodoroSession,
  Goal,
  Category,
  Project,
} from "@/lib/types"
import type {
  DailyBucket,
  FocusScoreBreakdown,
  StreakData,
  ProjectDistribution,
  CategoryDistribution,
  GoalProgress,
  DateRange,
} from "@/lib/types-reports"
import { calculateStreakInfo } from "@/lib/hooks/use-streak"

/**
 * Calculate Focus Score (0-100)
 * 40% Consistency + 30% Time on goals + 20% Streak + 10% Goal completion
 */
export function calculateFocusScore(
  activeDays: number,
  totalDays: number,
  timeOnTopProject: number,
  totalTime: number,
  currentStreak: number,
  streakTarget: number,
  goals: Goal[]
): FocusScoreBreakdown {
  const consistency = totalDays > 0 ? (activeDays / totalDays) * 40 : 0

  const timeOnGoals =
    totalTime > 0 ? Math.min(1, timeOnTopProject / (totalTime * 0.5)) * 30 : 0

  const streakRelative =
    streakTarget > 0 ? Math.min(1, currentStreak / streakTarget) * 20 : 0

  let goalCompletion = 0
  if (goals.length > 0) {
    const completionSum = goals.reduce((sum, g) => {
      if (g.target === 0) return sum
      return sum + Math.min(1, g.current / g.target)
    }, 0)
    goalCompletion = (completionSum / goals.length) * 10
  }

  const total = Math.round(consistency + timeOnGoals + streakRelative + goalCompletion)

  return {
    total: Math.min(100, total),
    consistency: Math.round(consistency),
    timeOnGoals: Math.round(timeOnGoals),
    streakRelative: Math.round(streakRelative),
    goalCompletion: Math.round(goalCompletion),
  }
}

/**
 * Calculate delta percentage
 */
export function calculateDelta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Generate daily buckets for a period
 */
export function generateDailyBuckets(
  range: DateRange,
  tasks: Task[],
  timeEntries: TimeEntry[],
  pomodoroSessions: PomodoroSession[]
): DailyBucket[] {
  const buckets: Map<string, DailyBucket> = new Map()

  // Initialize all days in range
  const current = new Date(range.start)
  while (current <= range.end) {
    const dateKey = current.toISOString().split("T")[0]
    buckets.set(dateKey, {
      date: new Date(current),
      timeSeconds: 0,
      tasksCompleted: 0,
      pomodorosCompleted: 0,
      intensity: 0,
    })
    current.setDate(current.getDate() + 1)
  }

  // Aggregate tasks
  tasks
    .filter((t) => t.completed)
    .forEach((task) => {
      const date = toDate(task.updatedAt)
      if (date >= range.start && date <= range.end) {
        const dateKey = date.toISOString().split("T")[0]
        const bucket = buckets.get(dateKey)
        if (bucket) {
          bucket.tasksCompleted++
        }
      }
    })

  // Aggregate time entries
  timeEntries.forEach((entry) => {
    const date = toDate(entry.startTime)
    if (date >= range.start && date <= range.end) {
      const dateKey = date.toISOString().split("T")[0]
      const bucket = buckets.get(dateKey)
      if (bucket) {
        bucket.timeSeconds += entry.duration || 0
      }
    }
  })

  // Aggregate pomodoro sessions
  pomodoroSessions
    .filter((s) => s.type === "pomodoro")
    .forEach((session) => {
      const date = toDate(session.completedAt)
      if (date >= range.start && date <= range.end) {
        const dateKey = date.toISOString().split("T")[0]
        const bucket = buckets.get(dateKey)
        if (bucket) {
          bucket.pomodorosCompleted++
        }
      }
    })

  // Calculate intensity
  buckets.forEach((bucket) => {
    bucket.intensity =
      bucket.tasksCompleted * 1 +
      bucket.pomodorosCompleted * 0.8 +
      (bucket.timeSeconds / 3600) * 0.5
  })

  return Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Calculate streak data
 */
export function calculateStreakData(tasks: Task[]): StreakData {
  const streakInfo = calculateStreakInfo(tasks)
  return {
    current: streakInfo.current,
    max: streakInfo.best,
    lastActiveDay: streakInfo.lastDay,
  }
}

/**
 * Calculate standard deviation of daily hours
 */
export function calculateStdDevHours(dailyBuckets: DailyBucket[]): number {
  if (dailyBuckets.length === 0) return 0

  const hoursPerDay = dailyBuckets.map((b) => b.timeSeconds / 3600)
  const mean = hoursPerDay.reduce((sum, h) => sum + h, 0) / hoursPerDay.length

  const variance =
    hoursPerDay.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hoursPerDay.length

  return Math.sqrt(variance)
}

/**
 * Calculate project distribution
 */
export function calculateProjectDistribution(
  timeEntries: TimeEntry[],
  tasks: Task[],
  projects: Project[],
  range: DateRange
): ProjectDistribution[] {
  const projectMap = new Map<string, { timeSeconds: number; tasksCount: number }>()

  // Aggregate time entries
  timeEntries
    .filter((e) => {
      const date = toDate(e.startTime)
      return date >= range.start && date <= range.end
    })
    .forEach((entry) => {
      entry.projectIds?.forEach((pid) => {
        if (!projectMap.has(pid)) {
          projectMap.set(pid, { timeSeconds: 0, tasksCount: 0 })
        }
        const data = projectMap.get(pid)!
        data.timeSeconds += entry.duration || 0
      })
    })

  // Aggregate tasks
  tasks
    .filter((t) => {
      if (!t.completed) return false
      const date = toDate(t.updatedAt)
      return date >= range.start && date <= range.end
    })
    .forEach((task) => {
      if (task.projectId) {
        if (!projectMap.has(task.projectId)) {
          projectMap.set(task.projectId, { timeSeconds: 0, tasksCount: 0 })
        }
        const data = projectMap.get(task.projectId)!
        data.tasksCount++
      }
    })

  const totalTime = Array.from(projectMap.values()).reduce(
    (sum, d) => sum + d.timeSeconds,
    0
  )

  const distribution: ProjectDistribution[] = []
  projectMap.forEach((data, projectId) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      distribution.push({
        projectId,
        projectName: project.name,
        timeSeconds: data.timeSeconds,
        percentage: totalTime > 0 ? (data.timeSeconds / totalTime) * 100 : 0,
        tasksCount: data.tasksCount,
        color: project.color,
      })
    }
  })

  return distribution.sort((a, b) => b.timeSeconds - a.timeSeconds)
}

/**
 * Calculate category distribution
 */
export function calculateCategoryDistribution(
  timeEntries: TimeEntry[],
  tasks: Task[],
  categories: Category[],
  range: DateRange
): CategoryDistribution[] {
  const categoryMap = new Map<string, { timeSeconds: number; tasksCount: number }>()

  // Aggregate time entries
  timeEntries
    .filter((e) => {
      const date = toDate(e.startTime)
      return date >= range.start && date <= range.end
    })
    .forEach((entry) => {
      entry.categoryIds?.forEach((cid) => {
        if (!categoryMap.has(cid)) {
          categoryMap.set(cid, { timeSeconds: 0, tasksCount: 0 })
        }
        const data = categoryMap.get(cid)!
        data.timeSeconds += entry.duration || 0
      })
    })

  // Aggregate tasks
  tasks
    .filter((t) => {
      if (!t.completed) return false
      const date = toDate(t.updatedAt)
      return date >= range.start && date <= range.end
    })
    .forEach((task) => {
      task.categoryIds?.forEach((cid) => {
        if (!categoryMap.has(cid)) {
          categoryMap.set(cid, { timeSeconds: 0, tasksCount: 0 })
        }
        const data = categoryMap.get(cid)!
        data.tasksCount++
      })
    })

  const totalTime = Array.from(categoryMap.values()).reduce(
    (sum, d) => sum + d.timeSeconds,
    0
  )

  const distribution: CategoryDistribution[] = []
  categoryMap.forEach((data, categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      distribution.push({
        categoryId,
        categoryName: category.name,
        timeSeconds: data.timeSeconds,
        percentage: totalTime > 0 ? (data.timeSeconds / totalTime) * 100 : 0,
        tasksCount: data.tasksCount,
        color: category.color,
      })
    }
  })

  return distribution.sort((a, b) => b.timeSeconds - a.timeSeconds)
}

/**
 * Calculate goal progress with projection
 */
export function calculateGoalProgressWithProjection(
  goal: Goal,
  range: DateRange,
  projects: Project[],
  categories: Category[]
): GoalProgress {
  const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0

  // Calculate average rate (simplified - based on period)
  const daysInPeriod = Math.ceil(
    (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
  )
  const averageRate = daysInPeriod > 0 ? goal.current / daysInPeriod : 0

  // Calculate projected days remaining
  const remaining = Math.max(0, goal.target - goal.current)
  const projectedDaysRemaining =
    averageRate > 0 ? Math.ceil(remaining / averageRate) : null

  // Check if on track
  const onTrack = percentage >= 50 || (projectedDaysRemaining !== null && projectedDaysRemaining <= 30)

  const projectNames = goal.projectIds
    ?.map((pid) => projects.find((p) => p.id === pid)?.name)
    .filter(Boolean) as string[] | undefined

  const categoryNames = goal.categoryIds
    ?.map((cid) => categories.find((c) => c.id === cid)?.name)
    .filter(Boolean) as string[] | undefined

  return {
    goalId: goal.id,
    title: goal.title,
    type: goal.type,
    current: goal.current,
    target: goal.target,
    percentage: Math.min(100, Math.round(percentage)),
    averageRate,
    projectedDaysRemaining,
    onTrack,
    projectNames,
    categoryNames,
  }
}

function toDate(value: any): Date {
  if (value instanceof Date) return value
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate()
  }
  return new Date(value)
}
