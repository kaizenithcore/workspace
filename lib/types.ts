// Core Data Types for the Productivity App

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  subscription: SubscriptionStatus
  settings: UserSettings
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  density: "comfortable" | "compact"
  language: "en" | "es"
  defaultPomodoroMinutes: number
  defaultShortBreakMinutes: number
  defaultLongBreakMinutes: number
  pomodorosUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notifications: boolean
  transparentCards: boolean
  backgroundImage: string | null
}

export interface SubscriptionStatus {
  plan: "free" | "trial" | "pro"
  trialEndsAt?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string // hex color
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  userId: string
  name: string
  categoryIds: string[] // a project can have one or more categories
  isDefault: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  color: string // hex color
}

export interface Task {
  id: string
  userId: string
  projectId?: string
  categoryIds: string[]
  title: string
  description?: string
  completed: boolean
  archived: boolean
  dueDate?: Date
  tags: string[]
  priority: "low" | "medium" | "high"
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  userId: string
  projectIds?: string[]
  categoryIds: string[]
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  userId: string
  projectIds: string[]
  categoryIds: string[]
  taskId?: string
  description: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  createdAt: Date
  updatedAt: Date
}

export interface PomodoroSession {
  id: string
  userId: string
  taskId?: string
  projectIds: string[]
  categoryIds: string[]
  type: "pomodoro" | "short_break" | "long_break"
  duration: number // in seconds
  completedAt: Date
  createdAt: Date
}

export type QuickAddType = "task" | "event" | "entry"

export type CalendarView = "day" | "week" | "month" | "year"

export type TaskGrouping = "day" | "category" | "urgency" | "project"

export interface Notification {
  id: string
  userId: string
  type: "task" | "pomodoro" | "tracker" | "system"
  title: string
  message?: string
  read: boolean
  createdAt: Date
  action?: {
    label: string
    href: string
  }
}

// ============ GOALS SYSTEM ============

export type GoalType = "count" | "time" | "streak" | "metric" | "milestone"
export type GoalUnit = "tasks" | "seconds" | "minutes" | "hours" | "days" | "pomodoros" | "percent"
export type GoalAutoCalcSource = "tasks" | "time_entries" | "pomodoro_sessions" | "manual"
export type GoalStatus = "active" | "paused" | "completed" | "failed"

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string | null
  type: GoalType
  target: number // count, seconds for time, days for streak, etc.
  current: number // computed snapshot
  unit: GoalUnit
  projectIds?: string[] | null
  categoryIds?: string[] | null
  dueDate?: Date | null
  autoCalcSource: GoalAutoCalcSource
  includeInChallenges: boolean
  status: GoalStatus
  milestoneOf?: string // link to parent milestone goal id
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export interface GoalSnapshot {
  id: string
  userId: string
  goalId: string
  value: number
  timestamp: Date
  ownerId: string
}

export type GoalEventType = "task_completed" | "time_entry" | "pomodoro" | "manual_adjust"

export interface GoalEvent {
  id: string
  userId: string
  goalId: string
  type: GoalEventType
  refId?: string // id of task/time_entry/pomodoro
  delta: number // increment applied (positive/negative)
  timestamp: Date
  ownerId: string
  meta?: Record<string, unknown>
}

export type ChallengeState = "active" | "paused" | "completed" | "failed"
export type ChallengeResetPeriod = "weekly" | "monthly" | "none"

export interface Challenge {
  id: string
  userId: string
  slug: string // e.g. "7-day-streak", "5-tasks-week"
  title: string
  description: string
  active: boolean
  state: ChallengeState
  startedAt?: Date
  expiresAt?: Date
  progress?: number // current progress (e.g. current streak day)
  target?: number // target to complete challenge
  resetPeriod?: ChallengeResetPeriod
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export interface StreakState {
  current: number // current streak days
  lastDay?: Date // last day a task was completed
  best: number // best streak ever
  updatedAt: Date
}

// Preset challenges available in system
export const PRESET_CHALLENGES = [
  {
    slug: "7-day-streak",
    titleKey: "challenges.7DayStreak.title",
    descriptionKey: "challenges.7DayStreak.description",
    target: 7,
    resetPeriod: "none",
  },
  {
    slug: "5-tasks-week",
    titleKey: "challenges.5TasksWeek.title",
    descriptionKey: "challenges.5TasksWeek.description",
    target: 5,
    resetPeriod: "weekly",
  },
  {
    slug: "14-day-streak",
    titleKey: "challenges.14DayStreak.title",
    descriptionKey: "challenges.14DayStreak.description",
    target: 14,
    resetPeriod: "none",
  },
  {
    slug: "20-tasks-month",
    titleKey: "challenges.20TasksMonth.title",
    descriptionKey: "challenges.20TasksMonth.description",
    target: 20,
    resetPeriod: "monthly",
  },
  {
    slug: "600-min-month",
    titleKey: "challenges.600MinMonth.title",
    descriptionKey: "challenges.600MinMonth.description",
    target: 600,
    resetPeriod: "monthly",
  },
  {
    slug: "10-pomodoros-week",
    titleKey: "challenges.10PomodorosWeek.title",
    descriptionKey: "challenges.10PomodorosWeek.description",
    target: 10,
    resetPeriod: "weekly",
  },
] as const
