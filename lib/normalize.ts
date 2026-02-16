/**
 * Normalization functions for Firestore schema compliance.
 * 
 * These functions ensure no `null` values reach Firestore by:
 * - Converting null to null for optional fields
 * - Removing null fields entirely
 * - Setting sensible defaults for required fields
 * - Adding ownerId automatically
 */

import type { Task, CalendarEvent, TimeEntry, PomodoroSession, Category, Project, Notification } from "@/lib/types"

// ---------------------------------------------------------------------------
// Task Normalization
// ---------------------------------------------------------------------------

export interface TaskInput {
  title: string
  description?: string
  completed?: boolean
  archived?: boolean
  dueDate?: Date
  projectId?: string
  categoryIds?: string[]
  tags?: string[]
  priority?: "low" | "medium" | "high"
  order?: number
}

export function normalizeTaskInput(
  input: TaskInput,
  userId: string,
): Omit<Task, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    title: input.title.trim(),

    ...(input.description?.trim()
      ? { description: input.description.trim() }
      : {}),

    ...(input.projectId
      ? { projectId: input.projectId }
      : {}),

    categoryIds: input.categoryIds?.length ? input.categoryIds : [],
    completed: input.completed ?? false,

    ...(input.dueDate
      ? { dueDate: input.dueDate }
      : {}),

    tags: input.tags?.length ? input.tags : [],
    priority: input.priority ?? "medium",
    order: input.order ?? 0,
    archived: input.archived ?? false,
  }
}


// ---------------------------------------------------------------------------
// Event Normalization
// ---------------------------------------------------------------------------

export interface EventInput {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay?: boolean
  projectIds?: string[]
  categoryIds?: string[]
  color?: string
  completed?: boolean
  archived?: boolean
}

export function normalizeEventInput(
  input: EventInput,
  userId: string,
): Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    title: input.title.trim(),

    ...(input.description?.trim()
      ? { description: input.description.trim() }
      : {}),

    startTime: input.startTime,
    endTime: input.endTime,
    allDay: input.allDay ?? false,
    completed: input.completed ?? false,
    archived: input.archived ?? false,

    ...(input.projectIds?.length
      ? { projectIds: input.projectIds }
      : {}),

    categoryIds: input.categoryIds?.length ? input.categoryIds : [],

    ...(input.color
      ? { color: input.color }
      : {}),
  }
}


// ---------------------------------------------------------------------------
// Time Entry Normalization
// ---------------------------------------------------------------------------

export interface TimeEntryInput {
  description?: string
  projectIds?: string[]
  categoryIds?: string[]
  taskId?: string | null
  startTime: Date
  endTime?: Date | null
  duration?: number
}

export function normalizeTimeEntryInput(
  input: TimeEntryInput,
  userId: string,
): Omit<TimeEntry, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    description: input.description?.trim() ?? "",

    projectIds: input.projectIds?.length ? input.projectIds : [],
    categoryIds: input.categoryIds?.length ? input.categoryIds : [],

    ...(input.taskId
      ? { taskId: input.taskId }
      : {}),

    startTime: input.startTime,

    ...(input.endTime
      ? { endTime: input.endTime }
      : {}),

    ...(typeof input.duration === "number"
      ? { duration: input.duration }
      : { duration: 0 }),
  }
}



// ---------------------------------------------------------------------------
// Pomodoro Session Normalization
// ---------------------------------------------------------------------------

export interface PomodoroSessionInput {
  taskId?: string | null
  projectIds?: string[]
  categoryIds?: string[]
  type: "pomodoro" | "short_break" | "long_break"
  duration: number
  completedAt: Date
}

export function normalizePomodoroSessionInput(
  input: PomodoroSessionInput,
  userId: string,
): Omit<PomodoroSession, "id" | "createdAt"> {
  return {
    userId,
    ...(input.taskId
      ? { taskId: input.taskId }
      : {}),
    projectIds: input.projectIds && input.projectIds.length > 0 ? input.projectIds : [],
    categoryIds: input.categoryIds && input.categoryIds.length > 0 ? input.categoryIds : [],
    type: input.type,
    duration: input.duration,
    completedAt: input.completedAt,
  }
}

// ---------------------------------------------------------------------------
// Category Normalization
// ---------------------------------------------------------------------------

export interface CategoryInput {
  name: string
  color: string
  order?: number
}

export function normalizeCategoryInput(
  input: CategoryInput,
  userId: string,
): Omit<Category, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    name: input.name.trim(),
    color: input.color,
    order: input.order ?? 0
  }
}

// ---------------------------------------------------------------------------
// Project Normalization
// ---------------------------------------------------------------------------

export interface ProjectInput {
  name: string
  color: string
  categoryIds?: string[]
  isDefault?: boolean
  order?: number
}

export function normalizeProjectInput(
  input: ProjectInput,
  userId: string,
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    name: input.name.trim(),
    color: input.color,
    categoryIds: input.categoryIds && input.categoryIds.length > 0 ? input.categoryIds : [],
    isDefault: input.isDefault ?? false,
    order: input.order ?? 0
  }
}

// ---------------------------------------------------------------------------
// Notification Normalization
// ---------------------------------------------------------------------------

export interface NotificationInput {
  type: "task" | "pomodoro" | "tracker" | "system"
  title: string
  message?: string | null
  action?: {
    label: string
    href: string
  }
}

export function normalizeNotificationInput(
  input: NotificationInput,
  userId: string,
): Omit<Notification, "id" | "createdAt"> {
  return {
    userId,
    type: input.type,
    title: input.title.trim(),
    read: false,

    ...(input.message?.trim()
      ? { message: input.message.trim() }
      : {}),

    ...(input.action
      ? { action: input.action }
      : {}),
  }
}
