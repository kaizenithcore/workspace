/**
 * Firestore CRUD helpers and realtime listeners.
 *
 * All top-level collections use `ownerId` so Firestore rules can enforce
 * per-user isolation. Every write sets serverTimestamp() for createdAt/updatedAt.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type {
  Category,
  Project,
  Task,
  CalendarEvent,
  TimeEntry,
  PomodoroSession,
  Notification,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert Firestore Timestamp fields to JS Dates on a flat doc. */
function convertTimestamps<T extends DocumentData>(data: DocumentData): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate()
    } else {
      result[key] = value
    }
  }
  return result as T
}

/** Shorthand – attach a realtime listener that converts docs to typed objects. */
function listen<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  onChange: (items: T[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, collectionName), ...constraints)
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...convertTimestamps<T>(d.data()),
      })) as T[]
      onChange(items)
    },
    (err) => {
      console.error(`[Firestore] Error listening to ${collectionName}:`, err)
      onError?.(err)
    },
  )
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(
  data: Omit<Category, "id" | "createdAt" | "updatedAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "categories"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
  await updateDoc(doc(db, "categories", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, "categories", id))
}

export function listenCategories(
  userId: string,
  onChange: (cats: Category[]) => void,
  onError?: (err: Error) => void,
) {
  return listen<Category>(
    "categories",
    [where("ownerId", "==", userId), orderBy("createdAt", "asc")],
    onChange,
    onError,
  )
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProject(id: string, data: Partial<Project>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
  await updateDoc(doc(db, "projects", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProject(id: string) {
  await deleteDoc(doc(db, "projects", id))
}

export function listenProjects(
  userId: string,
  onChange: (projs: Project[]) => void,
  onError?: (err: Error) => void,
) {
  return listen<Project>(
    "projects",
    [where("ownerId", "==", userId), orderBy("createdAt", "asc")],
    onChange,
    onError,
  )
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "tasks"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTask(id: string, data: Partial<Task>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
  await updateDoc(doc(db, "tasks", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, "tasks", id))
}

export function listenTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError?: (err: Error) => void,
  filters?: { projectId?: string; categoryId?: string },
) {
  const constraints: QueryConstraint[] = [where("ownerId", "==", userId)]
  if (filters?.projectId) {
    constraints.push(where("projectId", "==", filters.projectId))
  }
  // Note: filtering by categoryId inside an array requires array-contains
  if (filters?.categoryId) {
    constraints.push(where("categoryIds", "array-contains", filters.categoryId))
  }
  constraints.push(orderBy("order", "asc"))
  return listen<Task>("tasks", constraints, onChange, onError)
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function createEvent(
  data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "events"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
  await updateDoc(doc(db, "events", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, "events", id))
}

export function listenEvents(
  userId: string,
  onChange: (events: CalendarEvent[]) => void,
  onError?: (err: Error) => void,
  range?: { start: Date; end: Date },
) {
  const constraints: QueryConstraint[] = [where("ownerId", "==", userId)]
  if (range) {
    constraints.push(where("startTime", ">=", range.start))
    constraints.push(where("startTime", "<=", range.end))
  }
  constraints.push(orderBy("startTime", "asc"))
  return listen<CalendarEvent>("events", constraints, onChange, onError)
}

// ---------------------------------------------------------------------------
// Time Entries
// ---------------------------------------------------------------------------

/** Start a new time entry (no endTime yet). */
export async function startTimeEntry(data: {
  userId: string
  projectIds?: string[]
  categoryIds?: string[]
  taskId?: string
  description?: string
}) {
  const ref = await addDoc(collection(db, "time_entries"), {
    ...data,
    ownerId: data.userId,
    projectIds: data.projectIds ?? [],
    categoryIds: data.categoryIds ?? [],
    description: data.description ?? "",
    startTime: serverTimestamp(),
    endTime: null,
    duration: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Stop a running time entry – sets endTime and computes duration in seconds. */
export async function stopTimeEntry(entryId: string, startTime: Date) {
  const now = new Date()
  const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000)
  await updateDoc(doc(db, "time_entries", entryId), {
    endTime: now,
    duration: durationSeconds,
    updatedAt: serverTimestamp(),
  })
  return { endTime: now, duration: durationSeconds }
}

export async function createTimeEntry(
  data: Omit<TimeEntry, "id" | "createdAt" | "updatedAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "time_entries"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntry>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
  await updateDoc(doc(db, "time_entries", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTimeEntry(id: string) {
  await deleteDoc(doc(db, "time_entries", id))
}

export function listenTimeEntries(
  userId: string,
  onChange: (entries: TimeEntry[]) => void,
  onError?: (err: Error) => void,
  range?: { start: Date; end: Date },
) {
  const constraints: QueryConstraint[] = [where("ownerId", "==", userId)]
  if (range) {
    constraints.push(where("startTime", ">=", range.start))
    constraints.push(where("startTime", "<=", range.end))
  }
  constraints.push(orderBy("startTime", "desc"))
  return listen<TimeEntry>("time_entries", constraints, onChange, onError)
}

// ---------------------------------------------------------------------------
// Pomodoro Sessions
// ---------------------------------------------------------------------------

export async function createPomodoroSession(
  data: Omit<PomodoroSession, "id" | "createdAt"> & { ownerId?: string },
) {
  const ref = await addDoc(collection(db, "pomodoro_sessions"), {
    ...data,
    ownerId: data.ownerId ?? data.userId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export function listenPomodoros(
  userId: string,
  onChange: (sessions: PomodoroSession[]) => void,
  onError?: (err: Error) => void,
) {
  return listen<PomodoroSession>(
    "pomodoro_sessions",
    [where("ownerId", "==", userId), orderBy("createdAt", "desc")],
    onChange,
    onError,
  )
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function createNotification(data: {
  userId: string
  type: Notification["type"]
  title: string
  message?: string
  action?: Notification["action"]
}) {
  const ref = await addDoc(collection(db, "notifications"), {
    ...data,
    ownerId: data.userId,
    read: false,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, "notifications", id), { read: true })
}

export async function markAllNotificationsRead(userId: string) {
  // Note: Firestore has no bulk-update-by-query on the client.
  // For efficiency at scale, use a Cloud Function. For now, callers
  // iterate the local array and call markNotificationRead per doc.
  console.warn(
    "[Firestore] markAllNotificationsRead: Caller should iterate local array. userId:",
    userId,
  )
}

export async function deleteNotificationDoc(id: string) {
  await deleteDoc(doc(db, "notifications", id))
}

export function listenNotifications(
  userId: string,
  onChange: (notifs: Notification[]) => void,
  onError?: (err: Error) => void,
) {
  return listen<Notification>(
    "notifications",
    [where("ownerId", "==", userId), orderBy("createdAt", "desc")],
    onChange,
    onError,
  )
}
