export type ReportRange = "week" | "month" | "year" | "custom"
export type ReportScope = "global" | "project" | "category" | "goals"

export interface DateRange {
  start: Date
  end: Date
}

export interface ReportFilters {
  range: ReportRange
  customRange?: DateRange
  compareWithPrevious: boolean
  scope: ReportScope
  projectId?: string
  categoryId?: string
}

export interface StatCardData {
  label?: string
  value: number
  unit?: string
  delta?: number // percentage
  trend?: "up" | "down" | "neutral"
  tooltip?: string
}

export interface DailyBucket {
  date: Date
  timeSeconds: number
  tasksCompleted: number
  pomodorosCompleted: number
  intensity: number // calculated weighted sum
}

export interface ProjectDistribution {
  projectId: string
  projectName: string
  timeSeconds: number
  percentage: number
  tasksCount: number
  delta?: number
  color: string
}

export interface CategoryDistribution {
  categoryId: string
  categoryName: string
  timeSeconds: number
  percentage: number
  tasksCount: number
  delta?: number
  color: string
}

export interface FocusScoreBreakdown {
  total: number // 0-100
  consistency: number // 0-40
  timeOnGoals: number // 0-30
  streakRelative: number // 0-20
  goalCompletion: number // 0-10
}

export interface StreakData {
  current: number
  max: number
  lastActiveDay: Date | null
}

export interface GoalProgress {
  goalId: string
  title: string
  type: string
  current: number
  target: number
  percentage: number
  averageRate: number // tasks/week or seconds/day
  projectedDaysRemaining: number | null
  onTrack: boolean
  projectNames?: string[]
  categoryNames?: string[]
}

export interface ReportInsight {
  type: "consistency" | "comparison" | "streak" | "focus" | "goal"
  sentiment: "info" | "warning" | "success" | "error"
  message: string
  metadata?: Record<string, string | number>
}

export interface ReportData {
  period: DateRange
  previousPeriod?: DateRange
  stats: {
    totalTimeSeconds: number
    tasksCompleted: number
    pomodorosCompleted: number
    focusScore: FocusScoreBreakdown
  }
  previousStats?: {
    totalTimeSeconds: number
    tasksCompleted: number
    pomodorosCompleted: number
  }
  consistency: {
    activeDays: number
    totalDays: number
    activePercentage: number
    stdDevHours: number
    streak: StreakData
  }
  dailyBuckets: DailyBucket[]
  projectDistribution: ProjectDistribution[]
  categoryDistribution: CategoryDistribution[]
  goalProgress: GoalProgress[]
  insights: ReportInsight[]
}

export interface HeatmapCell {
  date: Date
  intensity: 0 | 1 | 2 | 3 | 4 // 0=none, 4=max
  label: string
}

export interface ReportAggregate {
  userId: string
  periodStart: Date
  periodEnd: Date
  totalTimeSeconds: number
  tasksCompleted: number
  pomodorosCompleted: number
  dailyBuckets: Record<string, {
    timeSeconds: number
    tasks: number
    pomodoros: number
  }>
  perProject: Record<string, {
    timeSeconds: number
    tasks: number
  }>
  perCategory: Record<string, {
    timeSeconds: number
    tasks: number
  }>
  generatedAt: Date
}
