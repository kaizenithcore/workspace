"use client"

import * as React from "react"
import type {
  Category,
  Project,
  Task,
  CalendarEvent,
  TimeEntry,
  PomodoroSession,
  Notification,
} from "@/lib/types"
import { useUser } from "@/lib/firebase/hooks"
import * as fs from "@/lib/firestore"
import * as normalize from "@/lib/normalize"

// ---------------------------------------------------------------------------
// Context interface – identical to before so the rest of the app is untouched
// ---------------------------------------------------------------------------

interface DataStoreContextValue {
  // loading / auth
  loading: boolean
  userId: string | null

  // Categories
  categories: Category[]
  addCategory: (category: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<Category>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Projects
  projects: Project[]
  addProject: (project: Omit<Project, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  reorderTasks: (taskId: string, newIndex: number) => void

  // Events
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<CalendarEvent>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // Time Entries
  timeEntries: TimeEntry[]
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<TimeEntry>
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteTimeEntry: (id: string) => Promise<void>

  // Pomodoro Sessions
  pomodoroSessions: PomodoroSession[]
  addSession: (session: Omit<PomodoroSession, "id" | "userId" | "createdAt">) => Promise<PomodoroSession>

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "userId" | "createdAt">) => Promise<Notification>
  markNotificationAsRead: (id: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>

  // Helpers
  getCategoryById: (id: string) => Category | undefined
  getProjectById: (id: string) => Project | undefined
  getTaskById: (id: string) => Task | undefined
  getCategoriesForIds: (ids: string[]) => Category[]
  getProjectsForIds: (ids: string[]) => Project[]
}

const DataStoreContext = React.createContext<DataStoreContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser()
  const uid = user?.uid ?? null

  // Realtime state
  const [categories, setCategories] = React.useState<Category[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([])
  const [sessions, setSessions] = React.useState<PomodoroSession[]>([])
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [firestoreReady, setFirestoreReady] = React.useState(false)

  // -----------------------------------------------------------------------
  // Subscribe to Firestore collections when user is authenticated
  // -----------------------------------------------------------------------
  React.useEffect(() => {
    if (!uid) {
      // Clear state on sign-out
      setCategories([])
      setProjects([])
      setTasks([])
      setEvents([])
      setTimeEntries([])
      setSessions([])
      setNotifications([])
      setFirestoreReady(false)
      return
    }

    let initialLoads = 0
    const totalCollections = 7
    const markLoaded = () => {
      initialLoads++
      if (initialLoads >= totalCollections) setFirestoreReady(true)
    }

    const unsubs = [
      fs.listenCategories(uid, (data) => { setCategories(data); markLoaded() }),
      fs.listenProjects(uid, (data) => { setProjects(data); markLoaded() }),
      fs.listenTasks(uid, (data) => { setTasks(data); markLoaded() }),
      fs.listenEvents(uid, (data) => { setEvents(data); markLoaded() }),
      fs.listenTimeEntries(uid, (data) => { setTimeEntries(data); markLoaded() }),
      fs.listenPomodoros(uid, (data) => { setSessions(data); markLoaded() }),
      fs.listenNotifications(uid, (data) => { setNotifications(data); markLoaded() }),
    ]

    return () => unsubs.forEach((unsub) => unsub())
  }, [uid])

  const loading = authLoading || (!!uid && !firestoreReady)

  // -----------------------------------------------------------------------
  // Category CRUD
  // -----------------------------------------------------------------------
  const addCategory = React.useCallback(
    async (category: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Category> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add category: no user")
        const now = new Date()
        return { ...category, id: `tmp-${Date.now()}`, userId: "", createdAt: now, updatedAt: now }
      }
      
      const normalized = normalize.normalizeCategoryInput(category, uid)
      const id = await fs.createCategory({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now, updatedAt: now }
    },
    [uid],
  )

  const updateCategory = React.useCallback(
    async (id: string, updates: Partial<Category>) => {
      if (uid) await fs.updateCategory(id, updates)
    },
    [uid],
  )

  const deleteCategory = React.useCallback(
    async (id: string) => {
      if (uid) await fs.deleteCategory(id)
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Project CRUD
  // -----------------------------------------------------------------------
  const addProject = React.useCallback(
    async (project: Omit<Project, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Project> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add project: no user")
        const now = new Date()
        return { ...project, id: `tmp-${Date.now()}`, userId: "", createdAt: now, updatedAt: now }
      }
      
      const normalized = normalize.normalizeProjectInput(project, uid)
      const id = await fs.createProject({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now, updatedAt: now }
    },
    [uid],
  )

  const updateProject = React.useCallback(
    async (id: string, updates: Partial<Project>) => {
      if (uid) await fs.updateProject(id, updates)
    },
    [uid],
  )

  const deleteProject = React.useCallback(
    async (id: string) => {
      if (uid) await fs.deleteProject(id)
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Task CRUD
  // -----------------------------------------------------------------------
  const addTask = React.useCallback(
    async (task: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Task> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add task: no user")
        const now = new Date()
        return { ...task, id: `tmp-${Date.now()}`, userId: "", createdAt: now, updatedAt: now }
      }
      
      const normalized = normalize.normalizeTaskInput(task, uid)
      const id = await fs.createTask({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now, updatedAt: now }
    },
    [uid],
  )

  const updateTask = React.useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (uid) await fs.updateTask(id, updates)
    },
    [uid],
  )

  const deleteTask = React.useCallback(
    async (id: string) => {
      if (uid) await fs.deleteTask(id)
    },
    [uid],
  )

  const reorderTasks = React.useCallback(
    (taskId: string, newIndex: number) => {
      setTasks((prev) => {
        const taskIndex = prev.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) return prev

        const newTasks = [...prev]
        const [removed] = newTasks.splice(taskIndex, 1)
        newTasks.splice(newIndex, 0, removed)

        const reordered = newTasks.map((task, index) => ({ ...task, order: index }))

        // Persist new order to Firestore (fire-and-forget)
        if (uid) {
          for (const task of reordered) {
            fs.updateTask(task.id, { order: task.order }).catch(() => {})
          }
        }

        return reordered
      })
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Event CRUD
  // -----------------------------------------------------------------------
  const addEvent = React.useCallback(
    async (event: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">): Promise<CalendarEvent> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add event: no user")
        const now = new Date()
        return { ...event, id: `tmp-${Date.now()}`, userId: "", createdAt: now, updatedAt: now }
      }
      
      const normalized = normalize.normalizeEventInput(event, uid)
      const id = await fs.createEvent({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now, updatedAt: now }
    },
    [uid],
  )

  const updateEvent = React.useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      if (uid) await fs.updateEvent(id, updates)
    },
    [uid],
  )

  const deleteEvent = React.useCallback(
    async (id: string) => {
      if (uid) await fs.deleteEvent(id)
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Time Entry CRUD
  // -----------------------------------------------------------------------
  const addTimeEntry = React.useCallback(
    async (entry: Omit<TimeEntry, "id" | "userId" | "createdAt" | "updatedAt">): Promise<TimeEntry> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add time entry: no user")
        const now = new Date()
        return { ...entry, id: `tmp-${Date.now()}`, userId: "", createdAt: now, updatedAt: now }
      }
      
      const normalized = normalize.normalizeTimeEntryInput(entry, uid)
      const id = await fs.createTimeEntry({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now, updatedAt: now }
    },
    [uid],
  )

  const updateTimeEntry = React.useCallback(
    async (id: string, updates: Partial<TimeEntry>) => {
      if (uid) await fs.updateTimeEntry(id, updates)
    },
    [uid],
  )

  const deleteTimeEntry = React.useCallback(
    async (id: string) => {
      if (uid) await fs.deleteTimeEntry(id)
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Pomodoro Sessions
  // -----------------------------------------------------------------------
  const addSession = React.useCallback(
    async (session: Omit<PomodoroSession, "id" | "userId" | "createdAt">): Promise<PomodoroSession> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add session: no user")
        const now = new Date()
        return { ...session, id: `tmp-${Date.now()}`, userId: "", createdAt: now }
      }
      
      const normalized = normalize.normalizePomodoroSessionInput(session, uid)
      const id = await fs.createPomodoroSession({ ...normalized, ownerId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now }
    },
    [uid],
  )

  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------
  const addNotification = React.useCallback(
    async (notification: Omit<Notification, "id" | "userId" | "createdAt">): Promise<Notification> => {
      if (!uid) {
        console.warn("[DataStore] Cannot add notification: no user")
        const now = new Date()
        return { ...notification, id: `tmp-${Date.now()}`, userId: "", createdAt: now }
      }
      
      const normalized = normalize.normalizeNotificationInput(notification, uid)
      const id = await fs.createNotification({ ...normalized, userId: uid })
      const now = new Date()
      return { ...normalized, id, createdAt: now }
    },
    [uid],
  )

  const markNotificationAsRead = React.useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      await fs.markNotificationRead(id)
    },
    [],
  )

  const markAllNotificationsAsRead = React.useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await Promise.all(unread.map((n) => fs.markNotificationRead(n.id)))
  }, [notifications])

  const deleteNotification = React.useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fs.deleteNotificationDoc(id)
  }, [])

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  const getCategoryById = React.useCallback((id: string) => categories.find((c) => c.id === id), [categories])
  const getProjectById = React.useCallback((id: string) => projects.find((p) => p.id === id), [projects])
  const getTaskById = React.useCallback((id: string) => tasks.find((t) => t.id === id), [tasks])
  const getCategoriesForIds = React.useCallback((ids: string[]) => categories.filter((c) => ids.includes(c.id)), [categories])
  const getProjectsForIds = React.useCallback((ids: string[]) => projects.filter((p) => ids.includes(p.id)), [projects])

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = React.useMemo<DataStoreContextValue>(
    () => ({
      loading,
      userId: uid,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      projects,
      addProject,
      updateProject,
      deleteProject,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      reorderTasks,
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      timeEntries,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      pomodoroSessions: sessions,
      addSession,
      notifications,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      getCategoryById,
      getProjectById,
      getTaskById,
      getCategoriesForIds,
      getProjectsForIds,
    }),
    [
      loading,
      uid,
      categories, addCategory, updateCategory, deleteCategory,
      projects, addProject, updateProject, deleteProject,
      tasks, addTask, updateTask, deleteTask, reorderTasks,
      events, addEvent, updateEvent, deleteEvent,
      timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry,
      sessions, addSession,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
      getCategoryById, getProjectById, getTaskById, getCategoriesForIds, getProjectsForIds,
    ],
  )

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const context = React.useContext(DataStoreContext)
  if (!context) {
    throw new Error("useDataStore must be used within a DataStoreProvider")
  }
  return context
}
